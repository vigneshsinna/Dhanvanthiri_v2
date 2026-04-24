# Admin Panel Modules Documentation

This document provides complete technical details, usage information, and detailed sub-category explanations for each module in the Dhanvanthiri admin panel.

---

## 1. Dashboard Module
- **Usage**: Primary administrative entry point providing real-time analytics and business health metrics.
- **Sub-categories & Features**:
    - **Sales Analytics**: Visual representation of sales trends (Daily, Weekly, Monthly).
    - **Top Performance**: Lists of top-selling products, top categories, and high-performing sellers.
    - **Order Statistics**: Breakdown of order statuses (Pending, Confirmed, Picked Up, On the way, Delivered, Cancelled).
    - **Member Statistics**: Insights into new customer registrations and seller activity.
- **Controller**: `App\Http\Controllers\AdminController`
- **Models**: `Order`, `Product`, `Category`, `Brand`, `User`
- **Views**: `resources/views/backend/dashboard`
- **Primary Routes**: `admin.dashboard`

---

## 2. Product Management Module
- **Usage**: Comprehensive management of the product catalog, including inventory, categorization, and variations.
- **Sub-categories & Features**:
    - **All Products**: Management of standard physical products, including stock levels, pricing, and visibility.
    - **Categories**: Multi-level hierarchical categorization (Category -> Sub-category -> Sub-sub-category).
    - **Brands**: Management of product brands with logo and featured status.
    - **Attributes**: Definition of product properties (e.g., Size, Material) used for variations.
    - **Colors**: Management of color swatches available for products.
    - **Digital Products**: Specialized workflow for products delivered via download (e.g., software, ebooks).
    - **Bulk Import/Export**: CSV/Excel tools for mass product creation and data extraction.
    - **Reviews**: Moderation and management of customer product ratings and comments.
    - **Warranties**: Configuration of warranty terms and durations applicable to products.
    - **Size Charts**: Management of dimension tables for clothing and other sized items.
- **Controllers**: 
    - `ProductController`, `CategoryController`, `BrandController`, `AttributeController`, `DigitalProductController`, `WarrantyController`, `ReviewController`, `SizeChartController`, `ProductBulkUploadController`
- **Models**: `Product`, `Category`, `Brand`, `Attribute`, `Color`, `Warranty`, `DigitalProduct`, `Review`, `SizeChart`
- **Views**: `resources/views/backend/product`
- **Primary Routes**: `products.*`, `categories.*`, `brands.*`, `attributes.*`, `digitalproducts.*`, `reviews.*`, `warranties.*`, `size-charts.*`

---

## 3. Sales & Order Management Module
- **Usage**: Full lifecycle management of customer purchases from placement to delivery.
- **Sub-categories & Features**:
    - **All Orders**: Centralized list of every order placed on the platform.
    - **In-house Orders**: Filtered view for orders fulfilled directly by the platform owner.
    - **Seller Orders**: Filtered view for orders fulfilled by third-party vendors.
    - **Pickup Point Orders**: Management of orders destined for specific self-pickup locations.
    - **Order Tracking**: Interface to update and monitor shipping tracking codes.
    - **Invoice Management**: Automated generation and manual printing of customer invoices.
- **Controllers**: 
    - `OrderController`, `InvoiceController`
- **Models**: `Order`, `OrderDetail`, `CombinedOrder`
- **Views**: `resources/views/backend/sales`, `resources/views/backend/invoices`
- **Primary Routes**: `all_orders.*`, `inhouse_orders.*`, `seller_orders.*`, `orders.details`, `invoice.download`

---

## 4. Seller Management Module
- **Usage**: Coordination and oversight of third-party vendors on the marketplace.
- **Sub-categories & Features**:
    - **Seller List**: Management of seller accounts, including banning and login impersonation for support.
    - **Seller Verification**: Approval workflow for vendor documents and identity proof.
    - **Withdrawal Requests**: Processing of seller payout requests once they reach the minimum balance.
    - **Seller Commissions**: Configuration of global or category-specific commission rates for vendor sales.
    - **Seller Packages**: (If enabled) Management of subscription plans for sellers.
- **Controllers**: 
    - `SellerController`, `SellerWithdrawRequestController`, `PaymentController`
- **Models**: `Seller`, `Shop`, `SellerWithdrawRequest`, `Payment`
- **Views**: `resources/views/backend/sellers`
- **Primary Routes**: `sellers.*`, `withdraw_requests.*`, `sellers.payment_histories`

---

## 5. Customer Management Module
- **Usage**: Tools for managing user relationships and customer-facing features.
- **Sub-categories & Features**:
    - **Customer List**: Database of all registered buyers, including address management and order history.
    - **Classified Products**: (If enabled) Moderation of second-hand products listed by customers.
    - **Customer Packages**: Management of premium membership plans for customers (e.g., for free shipping or discounts).
- **Controllers**: 
    - `CustomerController`, `CustomerPackageController`, `CustomerProductController`
- **Models**: `User`, `Customer`, `CustomerPackage`, `CustomerProduct`
- **Views**: `resources/views/backend/customer`
- **Primary Routes**: `customers.*`, `customer_packages.*`, `classified_products`

---

## 6. Marketing & Promotions Module
- **Usage**: Strategic tools to increase sales and user engagement.
- **Sub-categories & Features**:
    - **Coupons**: Creation of discount codes (Cart-based, Product-based, or Shipping-based).
    - **Flash Deals**: Setup of time-sensitive promotional events with specific product discounts.
    - **Newsletters**: Configuration and sending of mass marketing emails to subscribers.
    - **Subscribers**: Management of the email mailing list and export options.
    - **Dynamic Popups**: Setup of interactive entry/exit popups for promotions or lead generation.
    - **Custom Alerts**: Management of notification banners displayed at the top or bottom of the site.
- **Controllers**: 
    - `CouponController`, `FlashDealController`, `NewsletterController`, `SubscriberController`, `DynamicPopupController`, `CustomAlertController`
- **Models**: `Coupon`, `FlashDeal`, `DynamicPopup`, `CustomAlert`, `Subscriber`
- **Views**: `resources/views/backend/marketing`
- **Primary Routes**: `coupon.*`, `flash_deals.*`, `newsletters.*`, `subscribers.*`, `dynamic-popups.*`

---

## 7. Support & Communications Module
- **Usage**: Internal and external communication channels.
- **Sub-categories & Features**:
    - **Support Tickets**: Helpdesk system for resolving customer issues via a threaded messaging interface.
    - **Conversations**: Monitoring and management of private chats between buyers and sellers.
    - **Product Queries**: Management of public or private questions asked by users on product pages.
    - **Contact Messages**: Handling of submissions from the frontend "Contact Us" form.
- **Controllers**: 
    - `SupportTicketController`, `ConversationController`, `ProductQueryController`, `ContactController`
- **Models**: `Ticket`, `Conversation`, `ProductQuery`, `Contact`
- **Views**: `resources/views/backend/support`
- **Primary Routes**: `support_ticket.*`, `conversations.*`, `product_query.*`, `contacts`

---

## 8. Reports & Analytics Module
- **Usage**: Data-driven insights into platform performance.
- **Sub-categories & Features**:
    - **Sale Reports**: Detailed breakdown of sales by date, seller, or category.
    - **Stock Reports**: Monitoring of inventory levels and low-stock alerts.
    - **Wishlist Reports**: Analysis of products most added to customer wishlists.
    - **User Search Reports**: Log of keywords searched by users on the frontend.
    - **Commission History**: Record of all commissions earned from vendor sales.
    - **Earning/Payout Analytics**: Financial overview of platform revenue vs seller payouts.
- **Controllers**: 
    - `ReportController`, `EarningReportController`
- **Models**: `Order`, `Product`, `Wishlist`, `Search`
- **Views**: `resources/views/backend/reports`
- **Primary Routes**: `in_house_sale_report.*`, `seller_sale_report.*`, `stock_report.*`, `earning_payout_report.*`

---

## 9. Website & Content Management Module
- **Usage**: Frontend customization and CMS capabilities.
- **Sub-categories & Features**:
    - **Appearance**: Configuration of site colors, fonts, and global styling options.
    - **Custom Pages**: Creation and editing of static content pages (e.g., About Us, Terms).
    - **Header & Footer**: Customization of navigation menus, contact info, and copyright text.
    - **Elements**: Management of reusable UI blocks and homepage sections.
    - **Top Banners**: Management of the main promotional sliders and banners.
- **Controllers**: 
    - `WebsiteController`, `PageController`, `ElementController`, `TopBannerController`
- **Models**: `Page`, `Element`, `TopBanner`, `Slider`
- **Views**: `resources/views/backend/website_settings`
- **Primary Routes**: `website.*`, `custom-pages.*`, `elements.*`, `top_banner.*`

---

## 10. Setup & Configurations Module
- **Usage**: Critical system-level settings and integrations.
- **Sub-categories & Features**:
    - **General Settings**: Basic site info (Name, Logo, Timezone).
    - **Activation Settings**: Toggle switches for various platform features (e.g., Guest Checkout, Wallet).
    - **Payment Methods**: Integration and configuration of payment gateways (Paypal, Stripe, etc.).
    - **Shipping Configurations**: Setting up shipping costs, free shipping rules, and methods.
    - **Languages**: Multi-language support and translation management.
    - **Currencies**: Multi-currency support with exchange rate configuration.
    - **Third-party Services**: Configuration of SMTP, Google Analytics, Firebase, and Social Login.
- **Controllers**: 
    - `BusinessSettingsController`, `LanguageController`, `CurrencyController`, `TaxController`
- **Models**: `BusinessSetting`, `Language`, `Currency`, `Tax`
- **Views**: `resources/views/backend/setup_configurations`
- **Primary Routes**: `business_settings.*`, `languages.*`, `currency.*`, `tax.*`

---

## 11. Staff & Permissions Module
- **Usage**: Management of internal administrative access.
- **Sub-categories & Features**:
    - **All Staffs**: Management of admin-level user accounts.
    - **Staff Roles**: Creation of specific roles (e.g., Manager, Content Creator) with granular permissions.
- **Controllers**: 
    - `StaffController`, `RoleController`
- **Models**: `Staff`, `Role`, `Permission`
- **Views**: `resources/views/backend/staff`
- **Primary Routes**: `staffs.*`, `roles.*`

---

## 12. Blog System Module
- **Usage**: Managing the platform's editorial content.
- **Sub-categories & Features**:
    - **All Blogs**: Creating, editing, and publishing blog articles.
    - **Blog Categories**: Categorization of blog posts for easier navigation.
- **Controllers**: 
    - `BlogController`, `BlogCategoryController`
- **Models**: `Blog`, `BlogCategory`
- **Views**: `resources/views/backend/blog_system`
- **Primary Routes**: `blog.*`, `blog-category.*`

---

## 13. POS (Point of Sale) Module
- **Usage**: Managing physical store sales integrated with the online system.
- **Sub-categories & Features**:
    - **POS Interface**: Tablet/Desktop optimized checkout for in-person customers.
    - **POS Configuration**: Settings for thermal printers, receipts, and POS-specific taxes.
- **Controller**: `PosController`
- **Models**: `Order`, `Product`, `User`
- **Views**: `resources/views/backend/pos`
- **Primary Routes**: `poin-of-sales.*`

---

## 14. Shipping & Logistics Module
- **Usage**: Management of the physical delivery infrastructure.
- **Sub-categories & Features**:
    - **Countries, States & Cities**: Geographical database for shipping zones and tax rules.
    - **Shipping Carriers**: Configuration of logistics providers (e.g., FedEx, DHL).
    - **Shipping Zones**: Grouping of geographical areas for flat-rate or dynamic pricing.
    - **Pickup Points**: Management of physical locations where customers can collect orders.
    - **Box Sizes**: Pre-defined packaging dimensions for automated shipping calculations.
- **Controllers**: 
    - `CountryController`, `StateController`, `CityController`, `AreaController`, `CarrierController`, `ZoneController`, `PickupPointController`, `ShippingBoxSizeController`
- **Models**: `Country`, `State`, `City`, `Area`, `Carrier`, `Zone`, `PickupPoint`, `ShippingBoxSize`
- **Views**: `resources/views/backend/shipping_system` (partially shared with setup)
- **Primary Routes**: `countries.*`, `states.*`, `cities.*`, `carriers.*`, `zones.*`, `pick_up_points.*`

---

## 15. System Utilities & Uploads
- **Usage**: Maintenance and media management.
- **Sub-categories & Features**:
    - **Uploaded Files**: Centralized media manager for all images and attachments used across the site.
    - **System Update**: Workflow for applying new software versions or patches.
    - **Server Status**: Overview of server health (PHP version, memory limits, extensions).
    - **Sitemap**: Automated generation of XML sitemaps for SEO.
    - **Cache Management**: Tools to clear system and configuration caches.
- **Controllers**: 
    - `AizUploadController`, `UpdateController`, `AdminController`
- **Models**: `Upload`
- **Views**: `resources/views/backend/uploaded_files`, `resources/views/backend/system`
- **Primary Routes**: `uploaded-files.*`, `cache.clear`, `sitemap_generator`
