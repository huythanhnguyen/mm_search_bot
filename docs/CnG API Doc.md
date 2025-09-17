## API lấy thông tin sản phẩm:

1. Lấy thông tin sản phẩm  
   SKU, store, giá, hình ảnh sản phẩm, đơn vị sản phẩm, và mô tả  
   **Tham khảo**: [https://developer.adobe.com/commerce/webapi/graphql/schema/products/queries/products/](https://developer.adobe.com/commerce/webapi/graphql/schema/products/queries/products/)

**Endpoint**:   
[https://online.mmvietnam.com/graphql](https://online.mmvietnam.com/graphql)  
	**Method**: GET (Cần dùng method GET để đảm bảo performance)  
	**Header**: Store: b2c\_10010\_vi (Trong đó b2c\_ là tiền tố, 10010 là mã cửa hàng, \_vi là hậu tố để xác định ngôn ngữ, hiện tại có 2 option là \_vi: tiếng Việt và \_en: tiếng Anh)  
**Payload**:

| query { products(filter: { sku: { eq: "441976\_24419765" } }, pageSize: 10, currentPage: 1\) {   items {     id     uid     ...ProductDetailsFragment   } }}fragment ProductDetailsFragment on ProductInterface { sku name price {   regularPrice {     amount {       currency       value     }   } } price\_range {   maximum\_price {     final\_price {       currency       value     }     discount {       amount\_off       percent\_off     }   } } media\_gallery\_entries {   uid   label   position   disabled   file } small\_image {   url } unit\_ecom description {   html }} |
| :---- |

**Response**:

| {   "data": {       "products": {           "items": \[               {                   "id": 373958,                   "uid": "MzczOTU4",                   "sku": "441976\_24419765",                   "name": "Gạo Neptune ST25 Special, 5kg",                    "url\_key": "neptune-st25-special-5kg-1121839-10-441976",                    "url\_suffix": ".html",                   "price": {                       "regularPrice": {                           "amount": {                               "currency": "VND",                               "value": 229000                           }                       }                   },                   "price\_range": {                       "maximum\_price": {                           "final\_price": {                               "currency": "VND",                               "value": 145000                           },                           "discount": {                               "amount\_off": 84000,                               "percent\_off": 36.68                           }                       }                   },                   "small\_image": {                       "url": "https://b2b-mmpro.izysync.com/media/catalog/product/cache/40feddc31972b1017c1d2c6031703b61/4/4/441976.jpg"                   },                   "unit\_ecom": "Gói",                   "description": {                       "html": ""                   }               }           \]       }   }} |
| :---- |

Giải thích:

- id, uid: Mã định danh của sản phẩm  
- sku: giá trị sku  
- name: Tên sản phẩm   
- url\_key: Url sản phẩm  
- url\_suffix: Hậu tố url sản phẩm  
- regularPrice: giá gốc  
- final\_price: giá cuối (đã bao gồm khuyến mại)  
- amount\_off: giá trị giảm giá  
- percent\_off: tỉ lệ giảm giá  
- small\_image: link ảnh sản phẩm   
- unit\_ecom: đơn vị  
- description: mô tả sản phẩm  
2. Thông báo khi có thay đổi  
   \- Cần làm rõ với các thông tin nào sẽ được coi là có thay đổi (Ví dụ đổi tên, đổi article\_code, price….)  
   \- Cơ chế thông báo: ví dụ gọi API tới e-brochure, gửi email

## API đồng bộ và xác thực thông tin khách hàng

1. API đăng nhập  
   **Tham khảo**: [https://developer.adobe.com/commerce/webapi/graphql/schema/customer/mutations/generate-token/](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/mutations/generate-token/)

**Endpoint**:   
[https://online.mmvietnam.com/graphql](https://online.mmvietnam.com/graphql)  
	**Method**: POST  
	**Header**: Store: b2c\_10010\_vi (Trong đó b2c\_ là tiền tố, 10010 là mã cửa hàng, \_vi là hậu tố để xác định ngôn ngữ, hiện tại có 2 option là \_vi: tiếng Việt và \_en: tiếng Anh)  
**Payload**:

| mutation  {  generateCustomerToken(    email: "example@gmail.com",     password: "password"  ) {    token  }} |
| :---- |

**Response**:  
Thành công:

| {    "data": {        "generateCustomerToken": {            "token": "eyJraWQiOiIxIiwiYWxnIjoiSFMyNTYifQ.eyJ1aWQiOjE0NjgwMCwidXR5cGlkIjozLCJpYXQiOjE3MzU2MTM5MDAsImV4cCI6MTczNTYxNzUwMH0.7p6KADoowwOmwcAYnTMWl95Q6G4nZjpR6nFmww6Xy\_0"        }    }} |
| :---- |

Không thành công:

| {    "errors": \[        {            "message": "Thông tin tài khoản quý khách đăng nhập chưa đúng.",            "locations": \[                {                    "line": 2,                    "column": 3                }            \],            "path": \[                "generateCustomerToken"            \],            "extensions": {                "category": "graphql-authentication"            }        }    \],    "data": {        "generateCustomerToken": null    }} |
| :---- |

2. API đồng bộ  
   \- Cần làm rõ về chiều đồng bộ: Đồng bộ từ bên nào sang bên nào?

## API đẩy thông tin sản phẩm vào giỏ hàng Ecom

1. Đã đăng nhập  
   **Tham khảo**:   
   [https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/add-products/](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/add-products/)  
   

**Endpoint**:   
[https://online.mmvietnam.com/graphql](https://online.mmvietnam.com/graphql)  
	**Method**: POST  
	**Header**: 

- Store: b2c\_10010\_vi. Trong đó b2c\_ là tiền tố, 10010 là mã cửa hàng, \_vi là hậu tố để xác định ngôn ngữ, hiện tại có 2 option là \_vi: tiếng Việt và \_en: tiếng Anh.  
- Authorization: Bearer token. Trong đó token là giá trị token của customer lấy được sau khi đăng nhập.

	**Cần lấy thông tin cart id trước. Sau khi đăng nhập (Mục API get auto login MCard info \- A) gọi API với thông tin dưới đây:**  
**Payload:**

| mutation CreateCartAfterSignIn { cartId: createEmptyCart} |
| :---- |

**Response**:

| {   "data": {       "cartId": "u5IBt6KdXX48LUydLd9UmeLfgajq5t9L"   }} |
| :---- |

**Sau đó gọi api để add to cart:**  
**Payload**:

| mutation { addProductsToCart(   cartId: "nWUytcGUl1uNZ2zovFr4leeh0EdWVk1B",    use\_art\_no: true,   cartItems: \[       {       quantity:1,       sku:"408490"   }\]) {   cart {     itemsV2 {       items {         product {           name           sku         }       }     }   }   user\_errors {     code     message   } }} |
| :---- |

Trong đó:

- cartId: id của giỏ hàng  
- use\_art\_no \= true. Thì sku truyền vào chỉ cần là mã art\_no  
- sku: sku của sản phẩm muốn thêm  
- quantity: số lượng của sản phẩm muốn thêm

	Lưu ý: Mỗi lần được thêm 1 sản phẩm  
**Response**:  
Thành công:

| {   "data": {       "addProductsToCart": {           "cart": {               "itemsV2": {                   "items": \[                       {                           "product": {                               "name": "HOP QUA ORION TET AN 1 703.6G",                               "sku": "408490\_24084901"                           }                       }                   \]               }           },           "user\_errors": \[\]       }   }} |
| :---- |

Không thành công:

| {   "data": {       "addProductsToCart": {           "cart": {               "itemsV2": {                   "items": \[\]               }           },           "user\_errors": \[               {                   "code": "PRODUCT\_NOT\_FOUND",                   "message": "Could not find a product with SKU \\"408490\_240849012\\""               }           \]       }   }} |
| :---- |

2. Chưa đăng nhập  
   **Tham khảo**: [https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/create-guest-cart/](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/create-guest-cart/)  
   [https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/add-products/](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/add-products/)

**Endpoint**:   
[https://online.mmvietnam.com/graphql](https://online.mmvietnam.com/graphql)  
	**Method**: POST  
	**Header**: 

- Store: b2c\_10010\_vi. Trong đó b2c\_ là tiền tố, 10010 là mã cửa hàng, \_vi là hậu tố để xác định ngôn ngữ, hiện tại có 2 option là \_vi: tiếng Việt và \_en: tiếng Anh.

**Cần lấy thông tin cart id trước. Gọi API với thông tin dưới đây:**  
**Payload:**

| mutation {   createGuestCart {       cart {           id       }   } } |
| :---- |

**Response**:

| {   "data": {     "createGuestCart": {       "cart": {         "id": "4JQaNVJokOpFxrykGVvYrjhiNv9qt31C"       }     }   } } |
| :---- |

**Sau đó gọi api để add to cart:**  
**Payload**:

| mutation { addProductsToCart(   cartId: "nWUytcGUl1uNZ2zovFr4leeh0EdWVk1B",    use\_art\_no: true,   cartItems: \[       {       quantity:1,       sku:"408490"   }\]) {   cart {     itemsV2 {       items {         product {           name           sku         }       }     }   }   user\_errors {     code     message   } }} |
| :---- |

Trong đó:

- cartId: id của giỏ hàng  
- use\_art\_no \= true. Thì sku truyền vào chỉ cần là mã art\_no  
- sku: sku của sản phẩm muốn thêm  
- quantity: số lượng của sản phẩm muốn thêm

	Lưu ý: Mỗi lần được thêm 1 sản phẩm  
**Response**:  
Thành công:

| {   "data": {       "addProductsToCart": {           "cart": {               "itemsV2": {                   "items": \[                       {                           "product": {                               "name": "HOP QUA ORION TET AN 1 703.6G",                               "sku": "408490\_24084901"                           }                       }                   \]               }           },           "user\_errors": \[\]       }   }} |
| :---- |

Không thành công:

| {   "data": {       "addProductsToCart": {           "cart": {               "itemsV2": {                   "items": \[\]               }           },           "user\_errors": \[               {                   "code": "PRODUCT\_NOT\_FOUND",                   "message": "Could not find a product with SKU \\"408490\_240849012\\""               }           \]       }   }} |
| :---- |

## 

## API search sản phẩm để lấy được sku

**Endpoint**:   
[https://online.mmvietnam.com/graphql](https://online.mmvietnam.com/graphql)  
**Method**: GET  
	**Header**: 

- Store: b2c\_10010\_vi. Trong đó b2c\_ là tiền tố, 10010 là mã cửa hàng, \_vi là hậu tố để xác định ngôn ngữ, hiện tại có 2 option là \_vi: tiếng Việt và \_en: tiếng Anh.

**Payload**:  
query ProductSearch {  
 products(search: "441976", sort: { relevance: DESC }) {  
   items {  
     id  
     sku  
     name  
   }  
   total\_count  
 }  
}

**Response**:  
{  
 "data": {  
   "products": {  
     "items": \[  
       {  
         "id": 373958,  
         "sku": "441976\_24419765",  
         "name": "Gạo Neptune ST25 Special, 5kg"  
       }  
     \],  
     "total\_count": 1  
   }  
 }  
}

## API filter sản phẩm theo mm\_art\_no (Article Number)

**Endpoint**:   
[https://online.mmvietnam.com/graphql](https://online.mmvietnam.com/graphql)  
**Method**: GET  
	**Header**: 

- Store: b2c\_10010\_vi. Trong đó b2c\_ là tiền tố, 10010 là mã cửa hàng, \_vi là hậu tố để xác định ngôn ngữ, hiện tại có 2 option là \_vi: tiếng Việt và \_en: tiếng Anh.

**Payload**:

query {  
 products(  
   filter: {mm\_art\_no: {eq :"326124"}}  
 ) {  
   items {  
     id  
     sku  
     name  
     url\_key  
     url\_suffix  
     canonical\_url  
     url\_path  
     mm\_product\_type  
     url\_rewrites  
      {  
       parameters {  
         name  
         value  
       }  
       url  
      }  
   }  
   total\_count  
 }  
}

**Response**:  
{  
 "data": {  
   "products": {  
     "items": \[  
       {  
         "id": 373958,  
         "sku": "441976\_24419765",  
         "name": "Gạo Neptune ST25 Special, 5kg"  
       }  
     \],  
     "total\_count": 1  
   }  
 }  
}

## Sample link auto login from MCard

https://online.mmvietnam.com/mcard/?hash=1684d1f6899b9c9f54940a49fb0df277\&store=10012\&cust\_no=2223000048590019\&cust\_no\_mm=2222005191216\&phone=0385242064\&cust\_name=Thao%20Vu

## API get auto login MCard info

1. **Generate Login Info**

**Endpoint**:   
[https://online.mmvietnam.com/graphql](https://online.mmvietnam.com/graphql)  
**Method**: GET  
**Header**: 

- Store: b2c\_10010\_vi. Trong đó b2c\_ là tiền tố, 10010 là mã cửa hàng, \_vi là hậu tố để xác định ngôn ngữ, hiện tại có 2 option là \_vi: tiếng Việt và \_en: tiếng Anh.

**Syntax**

| mutation generateLoginMcardInfo($input: GenerateLoginMcardInfoInput) {  generateLoginMcardInfo(input: $input) {    customer\_token    store\_view\_code  }} |
| :---- |

**Request Variables:**

| {  "input": {    "hash": "1684d1f6899b9c9f54940a49fb0df277",    "store": "10012",    "cust\_no": "2223000048590019",    "phone": "0385242064",    "cust\_no\_mm":"2222005191216",    "cust\_name":"Thao Vu"  }} |
| :---- |

**Response:**   
**TH1: *customer\_token*** not null \-\>  Get tài khoản thành công

| {  "data": {    "generateLoginMcardInfo": {      "customer\_token": "eyJraWQiOiIxIiwiYWxnIjoiSFMyNTYifQ.eyJ1aWQiOjIzNzM1LCJ1dHlwaWQiOjMsImlhdCI6MTczMjc2NzQ2NSwiZXhwIjoxNzMyNzcxMDY1fQ.emqGEL7-yG6unsX737wpOpMbK4fwO0DAMstsNUJuMfY",      "store\_view\_code": "b2c\_10010\_vi"    }  }} |
| :---- |

**TH2: Has an error** \-\> Tài khoản không đúng

| {  "errors": \[    {      "message": "Tài khoản chưa chính xác, vui lòng kiểm tra lại hoặc liên hệ CSKH",      "locations": \[        {          "line": 2,          "column": 3        }      \],      "path": \[        "generateLoginMcardInfo"      \],      "extensions": {        "category": "graphql-authentication"      }    }  \],  "data": {    "generateLoginMcardInfo": null  }} |
| :---- |

**TH3: *customer\_token*** *is null \-\> Chưa có tài khoản*  (see **B)**

| {  "data": {    "generateLoginMcardInfo": {      "customer\_token": null,      "store\_view\_code": "b2c\_10010\_vi"    }  }} |
| :---- |

2. **Create Customer**

**Endpoint**:   
[https://online.mmvietnam.com/graphql](https://online.mmvietnam.com/graphql)  
**Method**: POST  
**Header**: 

- Store: b2c\_10010\_vi. Trong đó b2c\_ là tiền tố, 10010 là mã cửa hàng, \_vi là hậu tố để xác định ngôn ngữ, hiện tại có 2 option là \_vi: tiếng Việt và \_en: tiếng Anh.

**Syntax**

| mutation createCustomerFromMcard($input: CustomerCreateInput\!) {  createCustomerFromMcard(input: $input) {    customer\_token    customer {      email      firstname    }  }} |
| :---- |

**Request Variables:**

| {  "input": {    "email": "thaovt10@magenest.com",    "firstname": "thaovt1",    "lastname": "",    "is\_subscribed": false,    "custom\_attributes": \[      {        "attribute\_code": "company\_user\_phone\_number",        "value": "0000010"      },      {        "attribute\_code": "customer\_no",        "value": "0000001"      },      {        "attribute\_code": "mcard\_no",        "value": "0000001"      }    \]  }} |
| :---- |

**Response**

| {  "data": {    "createCustomerFromMcard": {      "customer\_token": "eyJraWQiOiIxIiwiYWxnIjoiSFMyNTYifQ.eyJ1aWQiOjExMTM0NywidXR5cGlkIjozLCJpYXQiOjE3MzM0MjEwOTAsImV4cCI6MTczMzQyNDY5MH0.-9YzmYonbvB554-Cl6DHAVtg0oyTDhQjuN1ZNldvjjU",      "customer": {        "email": "thaovt10@magenest.com",        "firstname": "thaovt1"      }    }  }} |
| :---- |

##  API lấy config token lifetime

**Endpoint**:   
[https://online.mmvietnam.com/graphql](https://online.mmvietnam.com/graphql)  
**Method**: GET  
**Header**: 

- Store: b2c\_10010\_vi. Trong đó b2c\_ là tiền tố, 10010 là mã cửa hàng, \_vi là hậu tố để xác định ngôn ngữ, hiện tại có 2 option là \_vi: tiếng Việt và \_en: tiếng Anh.

**Syntax**

| query GetStoreConfigData {         storeConfig {             customer\_access\_token\_lifetime         }     }  |
| :---- |

**Response: (đơn vị giờ)**

| {     "data": {         "storeConfig": {             "customer\_access\_token\_lifetime": 60         }     } } |
| :---- |

## 