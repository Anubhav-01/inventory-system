from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List

from app import models, schemas, crud, database
from app.database import engine, get_db

# Auto-create tables on startup
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Inventory & Order Management API",
    description="A production-ready full-stack backend service managing products, customers, orders, and inventory tracking.",
    version="1.0.0"
)

# CORS middleware to allow connection from the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For deployment and testing. Change to specific domain in production.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Global Exception Handlers ---

@app.exception_handler(ValueError)
async def value_error_handler(request, exc: ValueError):
    """
    Handle validation or business logic errors by returning 400 Bad Request
    """
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"detail": str(exc)}
    )

@app.exception_handler(IntegrityError)
async def integrity_error_handler(request, exc: IntegrityError):
    """
    Handle database constraint violations by returning 409 Conflict
    """
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={"detail": "Database Integrity Error. The operation conflicts with existing data (e.g. deleting a product associated with an order, or duplicate email/SKU)."}
    )


# --- Root / Health Check ---
@app.get("/", tags=["Health Check"])
async def root():
    return {
        "status": "healthy",
        "service": "Inventory & Order Management API",
        "version": "1.0.0"
    }


# --- Product Endpoints ---

@app.post("/products", response_model=schemas.ProductOut, status_code=status.HTTP_201_CREATED, tags=["Products"])
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db)):
    return crud.create_product(db=db, product=product)

@app.get("/products", response_model=List[schemas.ProductOut], tags=["Products"])
def read_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_products(db=db, skip=skip, limit=limit)

@app.get("/products/{id}", response_model=schemas.ProductOut, tags=["Products"])
def read_product(id: int, db: Session = Depends(get_db)):
    db_product = crud.get_product(db=db, product_id=id)
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    return db_product

@app.put("/products/{id}", response_model=schemas.ProductOut, tags=["Products"])
def update_product(id: int, product_update: schemas.ProductUpdate, db: Session = Depends(get_db)):
    db_product = crud.update_product(db=db, product_id=id, product_update=product_update)
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    return db_product

@app.delete("/products/{id}", response_model=schemas.ProductOut, tags=["Products"])
def delete_product(id: int, db: Session = Depends(get_db)):
    db_product = crud.delete_product(db=db, product_id=id)
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    return db_product


# --- Customer Endpoints ---

@app.post("/customers", response_model=schemas.CustomerOut, status_code=status.HTTP_201_CREATED, tags=["Customers"])
def create_customer(customer: schemas.CustomerCreate, db: Session = Depends(get_db)):
    return crud.create_customer(db=db, customer=customer)

@app.get("/customers", response_model=List[schemas.CustomerOut], tags=["Customers"])
def read_customers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_customers(db=db, skip=skip, limit=limit)

@app.get("/customers/{id}", response_model=schemas.CustomerOut, tags=["Customers"])
def read_customer(id: int, db: Session = Depends(get_db)):
    db_customer = crud.get_customer(db=db, customer_id=id)
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return db_customer

@app.delete("/customers/{id}", response_model=schemas.CustomerOut, tags=["Customers"])
def delete_customer(id: int, db: Session = Depends(get_db)):
    db_customer = crud.delete_customer(db=db, customer_id=id)
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return db_customer


# --- Order Endpoints ---

@app.post("/orders", response_model=schemas.OrderOut, status_code=status.HTTP_201_CREATED, tags=["Orders"])
def create_order(order: schemas.OrderCreate, db: Session = Depends(get_db)):
    return crud.create_order(db=db, order_data=order)

@app.get("/orders", response_model=List[schemas.OrderOut], tags=["Orders"])
def read_orders(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_orders(db=db, skip=skip, limit=limit)

@app.get("/orders/{id}", response_model=schemas.OrderOut, tags=["Orders"])
def read_order(id: int, db: Session = Depends(get_db)):
    db_order = crud.get_order(db=db, order_id=id)
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")
    return db_order

@app.delete("/orders/{id}", response_model=schemas.OrderOut, tags=["Orders"])
def delete_order(id: int, db: Session = Depends(get_db)):
    db_order = crud.delete_order(db=db, order_id=id)
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")
    return db_order


# --- Dashboard Endpoint ---

@app.get("/dashboard/summary", response_model=schemas.DashboardSummary, tags=["Dashboard"])
def get_dashboard(db: Session = Depends(get_db)):
    return crud.get_dashboard_summary(db=db)
