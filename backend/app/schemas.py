from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional
from decimal import Decimal
from datetime import datetime

# --- Product Schemas ---
class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    sku: str = Field(..., min_length=1, max_length=50)
    price: Decimal = Field(..., ge=0)
    quantity: int = Field(..., ge=0)

class ProductCreate(ProductBase):
    pass

class ProductUpdate(ProductBase):
    pass

class ProductOut(ProductBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# --- Customer Schemas ---
class CustomerBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=20)

class CustomerCreate(CustomerBase):
    pass

class CustomerOut(CustomerBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# --- Order Item Schemas ---
class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)

class OrderItemOut(BaseModel):
    id: int
    product_id: int
    quantity: int
    price: Decimal
    product_name: Optional[str] = None # Added for convenience in UI

    model_config = ConfigDict(from_attributes=True)


# --- Order Schemas ---
class OrderCreate(BaseModel):
    customer_id: int
    items: List[OrderItemCreate] = Field(..., min_length=1)

class OrderOut(BaseModel):
    id: int
    customer_id: int
    total_amount: Decimal
    created_at: datetime
    items: List[OrderItemOut]
    customer_name: Optional[str] = None # Added for convenience in UI

    model_config = ConfigDict(from_attributes=True)


# --- Dashboard Summary Schema ---
class DashboardSummary(BaseModel):
    total_products: int
    total_customers: int
    total_orders: int
    low_stock_products: List[ProductOut]
