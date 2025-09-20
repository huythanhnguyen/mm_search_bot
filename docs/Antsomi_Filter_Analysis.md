# Phân tích khả năng Filter của Antsomi CDP 365 API Smart Search

## Tổng quan
Dựa trên tài liệu [Tech] MMVN & CDP 365 API Smart Search.md, Antsomi API hỗ trợ filtering thông qua parameter `filters` dưới dạng JSON string.

## Cấu trúc Filter hiện tại

### 1. Filter Categories
```json
{
  "category": {
    "in": ["Bơ - Trứng - Sữa", "gà"]
  }
}
```

### 2. Filter Main Category ID
```json
{
  "main_category_id": {
    "in": ["MjUzOTM="]
  }
}
```

## Mapping với Product Feed Attributes

### ✅ **Có thể Filter (Được hỗ trợ trực tiếp)**

| Product Feed Attribute | Antsomi Filter Field | Ghi chú |
|------------------------|---------------------|---------|
| `main_category` | `main_category_id` | Sử dụng ID đã encode base64 |
| `category_level_1` | `category` | Sử dụng tên category |
| `category_level_2` | `category` | Có thể sử dụng tên category |

### ❓ **Có thể Filter (Cần kiểm tra thêm)**

| Product Feed Attribute | Khả năng | Ghi chú |
|------------------------|----------|---------|
| `price` | **Có thể** | Cần test với range filter |
| `original_price` | **Có thể** | Cần test với range filter |
| `brand` | **Có thể** | Cần test với brand filter |
| `status` | **Có thể** | Cần test với status filter |
| `visible` | **Có thể** | Có thể liên quan đến status |
| `store_code` | **Có thể** | Đã có `store_id` parameter |

### ❌ **Không thể Filter (Chưa được hỗ trợ)**

| Product Feed Attribute | Lý do |
|------------------------|-------|
| `product_id` | Chỉ có thể search theo SKU |
| `name` | Chỉ search text, không filter |
| `sku` | Chỉ search text, không filter |
| `image_url` | Không có filter cho URL |
| `product_url` | Không có filter cho URL |
| `store_name` | Chỉ có `store_id` |
| `unit` | Không có filter cho unit |
| `promotion_name` | Không có filter cho promotion |
| `mm_promotion_type` | Không có filter cho promotion type |
| `mm_features` | Không có filter cho features |
| `mm_start` | Không có filter cho date range |
| `mm_end` | Không có filter cho date range |
| `dnr_no` | Không có filter cho DNR |
| `dnr_interpretation` | Không có filter cho DNR |
| `main_category_uid` | Chỉ có `main_category_id` |
| `category_level_1_uid` | Chỉ có tên category |
| `category_level_2_uid` | Chỉ có tên category |

## Filter Examples cho Price (Quan tâm chính)

### 1. Filter theo Price Range (Cần test)
```json
{
  "price": {
    "gte": 100000,
    "lte": 500000
  }
}
```

### 2. Filter theo Original Price Range (Cần test)
```json
{
  "original_price": {
    "gte": 200000,
    "lte": 1000000
  }
}
```

### 3. Filter theo Discount (Cần test)
```json
{
  "discount_percentage": {
    "gte": 10
  }
}
```

## Filter Examples cho các Attributes khác

### 1. Filter theo Brand
```json
{
  "brand": {
    "in": ["Vinamilk", "TH True Milk"]
  }
}
```

### 2. Filter theo Status
```json
{
  "status": {
    "in": ["Active", "In Stock"]
  }
}
```

### 3. Filter kết hợp
```json
{
  "category": {
    "in": ["Sữa", "Bơ"]
  },
  "main_category_id": {
    "in": ["MjUyMzQ="]
  },
  "price": {
    "gte": 50000,
    "lte": 200000
  },
  "brand": {
    "in": ["Vinamilk"]
  }
}
```

## Khuyến nghị Implementation

### 1. Test các Filter chưa được document
- Test price range filtering
- Test brand filtering  
- Test status filtering
- Test combination filters

### 2. Tạo Filter Builder Utility
```python
def build_price_filter(min_price=None, max_price=None):
    """Build price filter for Antsomi API"""
    if min_price is None and max_price is None:
        return {}
    
    filter_dict = {}
    if min_price is not None:
        filter_dict["gte"] = min_price
    if max_price is not None:
        filter_dict["lte"] = max_price
    
    return {"price": filter_dict}

def build_category_filter(categories=None, main_category_ids=None):
    """Build category filter for Antsomi API"""
    filters = {}
    if categories:
        filters["category"] = {"in": categories}
    if main_category_ids:
        filters["main_category_id"] = {"in": main_category_ids}
    return filters
```

### 3. Extend Search Function
```python
async def search_products_with_filters(
    keywords: str, 
    price_min: Optional[float] = None,
    price_max: Optional[float] = None,
    categories: Optional[List[str]] = None,
    brands: Optional[List[str]] = None,
    status: Optional[List[str]] = None
):
    """Enhanced search with comprehensive filtering"""
    filters = {}
    
    # Add price filters
    if price_min is not None or price_max is not None:
        price_filter = {}
        if price_min is not None:
            price_filter["gte"] = price_min
        if price_max is not None:
            price_filter["lte"] = price_max
        filters["price"] = price_filter
    
    # Add other filters
    if categories:
        filters["category"] = {"in": categories}
    if brands:
        filters["brand"] = {"in": brands}
    if status:
        filters["status"] = {"in": status}
    
    return await search_products_antsomi(keywords, filters=filters)
```

## Kết quả Test Thực tế

### ✅ **Đã Test và Hoạt động**
- `main_category_id` filter: ✅ **Hoạt động tốt**
  - Sử dụng base64 encoded IDs
  - Trả về kết quả chính xác
  - Example: `{"main_category_id": {"in": ["MjUyMzQ="]}}`

### ❌ **Đã Test và Không Hoạt động**
- `price` filter: ❌ **Lỗi 500 Internal Server Error**
- `category` filter: ❌ **Không trả về kết quả**

### ❓ **Chưa Test**
- `brand` filter
- `status` filter
- `unit` filter
- Các filter khác

## Kết luận

Antsomi CDP 365 API hiện tại chỉ hỗ trợ filtering rất hạn chế:
- ✅ **main_category_id** (hoạt động tốt)
- ❌ **price** (lỗi server)
- ❌ **category** (không hoạt động)
- ❓ **Các filter khác** (chưa test)

**Về price filtering - yêu cầu chính:**
- ❌ **Không thể filter theo price** do lỗi server
- Cần liên hệ Antsomi để fix price filtering
- Hoặc implement price filtering ở client-side sau khi lấy data

**Khuyến nghị:**
1. **Sử dụng main_category_id filter** cho category filtering
2. **Implement client-side price filtering** sau khi lấy data từ API
3. **Liên hệ Antsomi** để fix price filtering issue
4. **Test thêm** các filter khác (brand, status, etc.)
