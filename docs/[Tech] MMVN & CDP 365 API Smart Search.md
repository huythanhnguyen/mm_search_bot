	  
 

**ANTSOMI CDP 365 API SMART SEARCH**

| Company | Antsomi |
| :---- | :---- |
| Website | [**https://antsomi.com**](https://Antsomi.com) |
| Document version | **1.3** |
| Platform | Website, Mobile Site |
| Client | **Mega Market** |
| URL | **https://online.mmvietnam.com/**  |
| Portal ID | **564892373** |

# **TABLE OF CONTENTS** {#table-of-contents}

[TABLE OF CONTENTS	1](#table-of-contents)

[CHANGELOG	2](#changelog)

[A \- PRERAPRE USER\_ID PARAMS	3](#a---prerapre-user_id-params)

[I \- Client Side	3](#i---client-side)

[II \- Server Side	3](#ii---server-side)

[B \- API ENDPOINT	3](#b---api-endpoint)

[I \- Suggest Keywords	3](#i---suggest-keywords)

[Endpoint	3](#endpoint)

[Param description	3](#param-description)

[a) Request parameters	3](#a\)-request-parameters)

[Sample cURL	3](#sample-curl)

[Response description	4](#response-description)

[Sample response	4](#sample-response)

[Notes	4](#notes)

[II \- Search Products	4](#ii---search-products)

[Endpoint	4](#endpoint-1)

[Param description	5](#param-description-1)

[a) Request parameters	5](#a\)-request-parameters-1)

[Sample cURL	5](#sample-curl-1)

[Response description	5](#response-description-1)

[Sample response	6](#sample-response-1)

[Notes	7](#notes-1)

# **CHANGELOG** {#changelog}

| Version | Change | Date of Change |
| :---- | :---- | :---- |
| v1.0 | Initial document |  |

# **A \- PRERAPRE USER\_ID PARAMS** {#a---prerapre-user_id-params}

CDP Smart Search API requires a parameter named "user\_id" which can be retrieved varies, depending on the environment.

## **I \- Client Side** {#i---client-side}

In your web page, invoke this method to get the "user\_id" value:  
getCookie("\_asm\_uid");

## **II \- Server Side** {#ii---server-side}

If you want to call the API from your backend server, please get the value of the cookie "\_asm\_uid" from your website and send it to your backend server.

# **B \- API ENDPOINT** {#b---api-endpoint}

## **I \- Suggest Keywords** {#i---suggest-keywords}

Returns a list of the top 10 keywords that relevant to the user-input keyword.

### ***Endpoint*** {#endpoint}

| Request URL | https://search.ants.tech/suggest |
| :---- | :---- |
| **Method**  | GET |
| **Content-Type** | application/json |

### ***Param description*** {#param-description}

#### ***a) Request parameters*** {#a)-request-parameters}

| Name | Data Type | Description | Example |
| :---- | :---- | :---- | :---- |
| q | String | The user input search keywords. | `thịt bò` |
| user\_id | String | The user\_id from [section A](#a---prerapre-user_id-params) | `564996752` |
| store\_id | String | The current store ID. | `10010` |
| product\_type | String | Determine B2B or B2c products. | `B2C` |

#### **b) Request headers**

| Name | Data Type | Required | Description | Example |
| :---- | :---- | :---- | :---- | :---- |
| Bearer Token | String | Yes | The access token. Hard-coded | eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwb3J0YWxJZCI6IjU2NDg5MjM3MyIsIm5hbWUiOiJNZWdhIE1hcmtldCJ9.iXymLjrJn-QVPO6gOV3MW8zJ4-u0Ih2L4qSOBZdIM24 |

### 

### ***Sample cURL*** {#sample-curl}

| curl \--location 'https://search.ants.tech/suggest?q=th%E1%BB%8Bt%20b%C3%B2\&user\_id=123\&store\_id=23123\&product\_type=`B2C`' \\\--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwb3J0YWxJZCI6IjU2NDg5MjM3MyIsIm5hbWUiOiJNZWdhIE1hcmtldCJ9.iXymLjrJn-QVPO6gOV3MW8zJ4-u0Ih2L4qSOBZdIM24 |
| :---- |

### ***Response description*** {#response-description}

The response is a JSON object, with the following schema:

| Name |  |  | Data Type | Description | Example |  |  |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| suggestions \[ |  |  |  |  |  |  |  |
|  | { |  |  |  |  |  |  |
|  |  | keyword | String | The suggested keyword. | `bột thịt bò` |  |  |
|  | } |  |  |  |  |  |  |
| \] |  |  |  |  |  |  |  |

### ***Sample response*** {#sample-response}

| {  "input": "thịt bò",  "suggestions": \[    {      "keyword": "thịt bò"    },    {      "keyword": "bò thịt"    }} |
| :---- |

| *Notes* Please encode the value of the q parameters |
| :---- |

## **II \- Search Products** {#ii---search-products}

Returns a list of 20 products that are relevant to the user-input keyword.

### ***Endpoint*** {#endpoint-1}

| Request URL | https://search.ants.tech/smart\_search |
| :---- | :---- |
| **Method**  | GET |
| **Content-Type** | application/json |

### ***Param description*** {#param-description-1}

#### ***a) Request parameters*** {#a)-request-parameters-1}

| Name | Data Type | Description | Example |
| :---- | :---- | :---- | :---- |
| q | String | The user input search keywords. | `thịt bò` |
| user\_id | String | The user\_id from [section A](#a---prerapre-user_id-params) | `564996752` |
| store\_id | String | The current store ID. | `10010` |
| product\_type | String | Flag to determine B2B or B2C products. | `B2C` |
| filters | String | (Optional) A JSON string represents the list of filtering categories. | `{"category":{"in":["Bơ - Trứng - Sữa","gà"]}}{"main_category_id":{"in":["MjUzOTM="]}}` |
| page | Number | The number of pages start from 1 | `1` |
| limit | Number | The number of products on each page min \= 1 and max \= 100 | `20` |

#### **Note:** If no 'page' and 'limit' values are passed, the system will automatically assume page \= 1 and limit \= 20

#### **b) Request headers**

| Name | Data Type | Required | Description | Example |
| :---- | :---- | :---- | :---- | :---- |
| Bearer Token | String | Yes | The access token. Hard-coded | eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwb3J0YWxJZCI6IjU2NDg5MjM3MyIsIm5hbWUiOiJNZWdhIE1hcmtldCJ9.iXymLjrJn-QVPO6gOV3MW8zJ4-u0Ih2L4qSOBZdIM24 |

### 

### ***Sample cURL*** {#sample-curl-1}

| curl \--location \--globoff 'https://search.ants.tech/smart\_search?q=th%E1%BB%8Bt%20b%C3%B2\&user\_id=123\&store\_id=123123\&product\_type=B2C\&filters=%7B%22category%22%3A%7B%22in%22%3A\[%22B%C6%A1%20-%20Tr%E1%BB%A9ng%20-%20S%E1%BB%AFa%22%2C%22g%C3%A0%22\]%7D%7D' \\\--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwb3J0YWxJZCI6IjU2NDg5MjM3MyIsIm5hbWUiOiJNZWdhIE1hcmtldCJ9.iXymLjrJn-QVPO6gOV3MW8zJ4-u0Ih2L4qSOBZdIM24' |
| :---- |

### ***Response description*** {#response-description-1}

The response is a JSON object, with the following schema:

| Name |  |  | Data Type | Description | Example |  |  |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| results \[ |  |  |  |  |  |  |  |
|  | { |  |  |  |  |  |  |
|  |  | id | String | The product ID in CDP. | `2115_10010` |  |  |
|  |  | title | String | The product name. | `Thịt bê thui` |  |  |
|  |  | sku | String | The product SKU. | `2115_20021153` |  |  |
|  |  | status | String | The product status in CDP. | `Active` |  |  |
|  |  | category | String | The product's main category. | `Unknown` |  |  |
|  |  | page\_url | String | The product page URL. | `https://online.mmvietnam.com/be-thui-thit-be-20021153-2115.html` |  |  |
|  |  | image\_url | String | The product feature image URL. | `https://mmpro.vn/media/catalog/product/j/p/jpeg-optimizer_2115_2.jpg` |  |  |
|  |  | price | Number | The product sale price. | `259000.0` |  |  |
|  |  | original\_price | Number | The product's original price. | `259000.0` |  |  |
|  | } |  |  |  |  |  |  |
| \] |  |  |  |  |  |  |  |
| type |  |  | String | Flag check, whether the user-input keywords is an SKU, or a keyword in product title. |  |  |  |
| total |  |  | String | Number of product in result |  |  |  |
| categories |  |  |  |  |  |  |  |

### ***Sample response*** {#sample-response-1}

| {  "query\_original": "thịt bò",  "results": \[    {      "id": "2115\_10010",      "title": "Thịt bê thui",      "sku": "2115\_20021153",      "status": "Active",      "category": "Unknown",      "page\_url": "https://online.mmvietnam.com/be-thui-thit-be-20021153-2115.html",      "image\_url": "https://mmpro.vn/media/catalog/product/j/p/jpeg-optimizer\_2115\_2.jpg",      "price": "259000.0",      "original\_price": "259000.0"    },  \],   "total": 188,   "type": "",   "categories": {     "main\_category": \[       {         "name": "Do hop \- Do kho",         "id": "MjUyMzQ=",         "count": 47       },       {         "name": "Dau an \- Gia vi \- Nuoc cham",         "id": "MjUwMzE=",         "count": 37       }     \],     "category\_level\_1": \[\],     "category\_level\_2": \[\]   }} |
| :---- |

| *Notes* Please encode the value of the q and filters parameters. |
| :---- |

## **III \- Search SKU**

If the keyword is number, the result will match with Product SKU.

### ***Endpoint***

| Request URL | https://search.ants.tech/smart\_search |
| :---- | :---- |
| **Method**  | GET |
| **Content-Type** | application/json |

### ***Param description***

#### ***a) Request parameters***

| Name | Data Type | Description | Example |
| :---- | :---- | :---- | :---- |
| q | String | The user input search Product SKU. | `2115_20021153` |
| user\_id | String | The user\_id from [section A](https://docs.google.com/document/d/1WUqgy_fFHNRijFGrcSQ5gUCBiOhXfOq8COLAWCVfI2E/edit?hl=en&forcehl=1&tab=t.0#heading=h.p7ogsdbeu991) | `564996752` |
| store\_id | String | The current store ID. | `10010` |
| product\_type | String | Flag to determine B2B or B2C products. | `B2C` |

#### **b) Request headers**

| Name | Data Type | Required | Description | Example |
| :---- | :---- | :---- | :---- | :---- |
| Bearer Token | String | Yes | The access token. Hard-coded | eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwb3J0YWxJZCI6IjU2NDg5MjM3MyIsIm5hbWUiOiJNZWdhIE1hcmtldCJ9.iXymLjrJn-QVPO6gOV3MW8zJ4-u0Ih2L4qSOBZdIM24 |

### 

### ***Sample cURL***

| curl \--location \--globoff 'https://search.ants.tech/smart\_search?q=`2115_10010`\&user\_id=123\&store\_id=123123\&product\_type=B2C\&filters=%7B%22category%22%3A%7B%22in%22%3A\[%22B%C6%A1%20-%20Tr%E1%BB%A9ng%20-%20S%E1%BB%AFa%22%2C%22g%C3%A0%22\]%7D%7D' \\\--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwb3J0YWxJZCI6IjU2NDg5MjM3MyIsIm5hbWUiOiJNZWdhIE1hcmtldCJ9.iXymLjrJn-QVPO6gOV3MW8zJ4-u0Ih2L4qSOBZdIM24' |
| :---- |

### ***Response description***

The response is a JSON object, with the following schema:

| Name |  |  | Data Type | Description | Example |  |  |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| results \[ |  |  |  |  |  |  |  |
|  | { |  |  |  |  |  |  |
|  |  | id | String | The product ID in CDP. | `2115_10010` |  |  |
|  |  | title | String | The product name. | `Thịt bê thui` |  |  |
|  |  | sku | String | The product SKU. | `2115_20021153` |  |  |
|  |  | status | String | The product status in CDP. | `Active` |  |  |
|  |  | category | String | The product's main category. | `Unknown` |  |  |
|  |  | page\_url | String | The product page URL. | `https://online.mmvietnam.com/be-thui-thit-be-20021153-2115.html` |  |  |
|  |  | image\_url | String | The product feature image URL. | `https://mmpro.vn/media/catalog/product/j/p/jpeg-optimizer_2115_2.jpg` |  |  |
|  |  | price | Number | The product sale price. | `259000.0` |  |  |
|  |  | original\_price | Number | The product's original price. | `259000.0` |  |  |
|  | } |  |  |  |  |  |  |
| \] |  |  |  |  |  |  |  |
| type |  |  | String | sku: Based on this value, determine whether the correct output is an SKU or a product list. From there, the Frontend navigates further. |  |  |  |

### ***Sample response***

| {  "query\_original": "thịt bò",  "results": \[    {      "id": "2115\_10010",      "title": "Thịt bê thui",      "sku": "2115\_20021153",      "status": "Active",      "category": "Unknown",      "page\_url": "https://online.mmvietnam.com/be-thui-thit-be-20021153-2115.html",      "image\_url": "https://mmpro.vn/media/catalog/product/j/p/jpeg-optimizer\_2115\_2.jpg",      "price": "259000.0",      "original\_price": "259000.0"    },  \],   "type": "sku",} |
| :---- |

| *Notes* Please encode the value of the q parameters. |
| :---- |

