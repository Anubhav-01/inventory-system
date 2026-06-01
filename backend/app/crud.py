from sqlalchemy.orm import Session
from sqlalchemy import func
from app import models, schemas
from app.config import settings
from decimal import Decimal

# --- Product CRUD ---

def get_product(db: Session, product_id: int):
    return db.query(models.Product).filter(models.Product.id == product_id).first()

def get_product_by_sku(db: Session, sku: str):
    return db.query(models.Product).filter(models.Product.sku == sku).first()

def get_products(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Product).offset(skip).limit(limit).all()

def create_product(db: Session, product: schemas.ProductCreate):
    # Business rule: Product SKU/code must be unique
    existing_product = get_product_by_sku(db, product.sku)
    if existing_product:
        raise ValueError(f"SKU '{product.sku}' is already in use by another product.")
    
    db_product = models.Product(
        name=product.name,
        sku=product.sku,
        price=product.price,
        quantity=product.quantity
    )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

def update_product(db: Session, product_id: int, product_update: schemas.ProductUpdate):
    db_product = get_product(db, product_id)
    if not db_product:
        return None
    
    # Business rule: Product SKU/code must be unique
    if db_product.sku != product_update.sku:
        existing_product = get_product_by_sku(db, product_update.sku)
        if existing_product:
            raise ValueError(f"SKU '{product_update.sku}' is already in use by another product.")
            
    db_product.name = product_update.name
    db_product.sku = product_update.sku
    db_product.price = product_update.price
    db_product.quantity = product_update.quantity
    
    db.commit()
    db.refresh(db_product)
    return db_product

def delete_product(db: Session, product_id: int):
    db_product = get_product(db, product_id)
    if not db_product:
        return None
    db.delete(db_product)
    db.commit()
    return db_product


# --- Customer CRUD ---

def get_customer(db: Session, customer_id: int):
    return db.query(models.Customer).filter(models.Customer.id == customer_id).first()

def get_customer_by_email(db: Session, email: str):
    return db.query(models.Customer).filter(models.Customer.email == email).first()

def get_customers(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Customer).offset(skip).limit(limit).all()

def create_customer(db: Session, customer: schemas.CustomerCreate):
    # Business rule: Customer email must be unique
    existing_customer = get_customer_by_email(db, customer.email)
    if existing_customer:
        raise ValueError(f"Email '{customer.email}' is already registered with another customer.")
        
    db_customer = models.Customer(
        name=customer.name,
        email=customer.email,
        phone=customer.phone
    )
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

def delete_customer(db: Session, customer_id: int):
    db_customer = get_customer(db, customer_id)
    if not db_customer:
        return None
    db.delete(db_customer)
    db.commit()
    return db_customer


# --- Order CRUD ---

def get_order(db: Session, order_id: int):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if order:
        # Inject convenience names for UI consumption
        for item in order.items:
            item.product_name = item.product.name if item.product else "Deleted Product"
        order.customer_name = order.customer.name if order.customer else "Deleted Customer"
    return order

def get_orders(db: Session, skip: int = 0, limit: int = 100):
    orders = db.query(models.Order).offset(skip).limit(limit).all()
    for order in orders:
        order.customer_name = order.customer.name if order.customer else "Deleted Customer"
        for item in order.items:
            item.product_name = item.product.name if item.product else "Deleted Product"
    return orders

def create_order(db: Session, order_data: schemas.OrderCreate):
    # Verify customer exists
    customer = get_customer(db, order_data.customer_id)
    if not customer:
        raise ValueError(f"Customer with ID {order_data.customer_id} does not exist.")
    
    total_amount = Decimal("0.0")
    order_items_to_create = []
    products_to_update = []
    
    # Business rule: Orders cannot be placed if inventory is insufficient.
    # Creating an order must automatically reduce available stock.
    # The total order amount must be calculated automatically by the backend.
    for item in order_data.items:
        product = get_product(db, item.product_id)
        if not product:
            raise ValueError(f"Product with ID {item.product_id} does not exist.")
        
        if product.quantity < item.quantity:
            raise ValueError(
                f"Insufficient inventory for product '{product.name}' (SKU: {product.sku}). "
                f"Requested: {item.quantity}, Available: {product.quantity}."
            )
        
        # Calculate price for this order item based on backend stored price
        item_total = Decimal(str(product.price)) * Decimal(item.quantity)
        total_amount += item_total
        
        # Deduct inventory
        product.quantity -= item.quantity
        products_to_update.append(product)
        
        # Create order item record
        db_order_item = models.OrderItem(
            product_id=product.id,
            quantity=item.quantity,
            price=product.price
        )
        order_items_to_create.append(db_order_item)

    # Create parent order
    db_order = models.Order(
        customer_id=order_data.customer_id,
        total_amount=total_amount
    )
    db.add(db_order)
    db.flush() # Generates order ID
    
    # Associate items and save
    for item in order_items_to_create:
        item.order_id = db_order.id
        db.add(item)
        
    db.commit()
    db.refresh(db_order)
    
    # Add names to output schema structure
    db_order.customer_name = customer.name
    for item in db_order.items:
        product = get_product(db, item.product_id)
        item.product_name = product.name if product else "Unknown"

    return db_order

def delete_order(db: Session, order_id: int):
    # Business logic rule: Restoring stock on delete/cancel
    db_order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not db_order:
        return None
        
    # Revert product stock
    for item in db_order.items:
        product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        if product:
            product.quantity += item.quantity
            
    db.delete(db_order)
    db.commit()
    return db_order


# --- Dashboard CRUD ---

def get_dashboard_summary(db: Session):
    total_products = db.query(models.Product).count()
    total_customers = db.query(models.Customer).count()
    total_orders = db.query(models.Order).count()
    
    low_stock = db.query(models.Product).filter(
        models.Product.quantity < settings.LOW_STOCK_THRESHOLD
    ).all()
    
    return schemas.DashboardSummary(
        total_products=total_products,
        total_customers=total_customers,
        total_orders=total_orders,
        low_stock_products=[schemas.ProductOut.model_validate(p) for p in low_stock]
    )
