import React, { useState, useEffect } from 'react';
import { 
  User, VendorProfile, Product, RawMaterial, CartItem, 
  Order, ProductReview, VendorSettlement, ToastMessage, OrderStatus, UserRole 
} from './types';
import { storageService } from './services/storage';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { VendorShopView } from './components/VendorShopView';
import { EtsyCuratedSections } from './components/EtsyCuratedSections';
import { RawMaterialsPage } from './components/RawMaterialsPage';
import { SellerSignupPage } from './components/SellerSignupPage';
import { BuyerProfileView } from './components/BuyerProfileView';
import { SellerDashboardView } from './components/SellerDashboardView';
import { AdminDashboardView } from './components/AdminDashboardView';
import { ShippingManagementPage } from './components/ShippingManagementPage';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { CraftAdvisorModal } from './components/CraftAdvisorModal';
import { ToastContainer } from './components/ToastContainer';
import { Footer } from './components/Footer';
import { Sparkles, Store, Layers, Heart, Package, Search } from 'lucide-react';

export default function App() {
  // Storage State
  const [currentUser, setCurrentUser] = useState<User>(() => storageService.getCurrentUser());
  const [products, setProducts] = useState<Product[]>(() => storageService.getProducts());
  const [vendors, setVendors] = useState<VendorProfile[]>(() => storageService.getVendors());
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>(() => storageService.getRawMaterials());
  const [cart, setCart] = useState<CartItem[]>(() => storageService.getCart());
  const [wishlist, setWishlist] = useState<string[]>(() => storageService.getWishlist(storageService.getCurrentUser().id).map(w => w.productId));
  const [orders, setOrders] = useState<Order[]>(() => storageService.getOrders());
  const [reviews, setReviews] = useState<ProductReview[]>(() => storageService.getReviews());
  const [settlements, setSettlements] = useState<VendorSettlement[]>(() => storageService.getSettlements());

  // UI View & Navigation State
  const [activeView, setActiveView] = useState<string>('explore'); // 'explore' | 'raw_materials' | 'seller_signup' | 'buyer_profile' | 'seller_dashboard' | 'vendor_shop'
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);

  const handleSelectVendor = (vendorId: string) => {
    setSelectedVendorId(vendorId);
    setActiveView('vendor_shop');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Modals & Drawers
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartDrawerOpen, setCartDrawerOpen] = useState<boolean>(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState<boolean>(false);
  const [advisorModalOpen, setAdvisorModalOpen] = useState<boolean>(false);

  // Toast Notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Subscribe to storage changes
  useEffect(() => {
    const unsubscribe = storageService.subscribe(() => {
      setCurrentUser(storageService.getCurrentUser());
      setProducts(storageService.getProducts());
      setVendors(storageService.getVendors());
      setRawMaterials(storageService.getRawMaterials());
      setCart(storageService.getCart());
      const u = storageService.getCurrentUser();
      setWishlist(storageService.getWishlist(u.id).map(w => w.productId));
      setOrders(storageService.getOrders());
      setReviews(storageService.getReviews());
      setSettlements(storageService.getSettlements());
    });
    return () => unsubscribe();
  }, []);

  const showToast = (title: string, message: string, type: ToastMessage['type'] = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const handleDismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Role Switcher Handler
  const handleRoleChange = (newRole: UserRole) => {
    storageService.setCurrentUserRole(newRole);
    showToast('Role Switched', `Switched to ${newRole.replace('_', ' ')} view mode.`, 'info');
  };

  // Wishlist Handler
  const handleToggleWishlist = (productId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const { isWishlisted } = storageService.toggleWishlist(currentUser.id, productId);
    const prod = products.find(p => p.id === productId);
    if (isWishlisted) {
      showToast('Added to Wishlist', `Saved "${prod?.title || 'Item'}" to your wishlist.`, 'success');
    } else {
      showToast('Removed from Wishlist', 'Item removed from your wishlist.', 'info');
    }
  };

  // Add Handcrafted Product to Cart
  const handleAddToCart = (
    product: Product,
    quantity: number,
    customSelections: any[] = [],
    customNote: string = ''
  ) => {
    storageService.addToCart({
      productId: product.id,
      itemType: 'product',
      title: product.title,
      image: product.images[0],
      unitPriceCents: product.priceCents,
      quantity,
      vendorId: product.vendorProfileId,
      vendorName: product.vendorName,
      isCustomizable: product.isCustomizable,
      customSelections,
      customNote
    });

    showToast('Item Added to Cart!', `${quantity}x "${product.title}" added to your craft cart.`, 'success');
    setSelectedProduct(null);
    setCartDrawerOpen(true);
  };

  // Add Raw Material to Cart
  const handleAddRawMaterialToCart = (item: any) => {
    storageService.addToCart(item);
    showToast('Wholesale Material Added!', `${item.quantity}x "${item.title}" added to your cart.`, 'success');
    setCartDrawerOpen(true);
  };

  // Quick Add to Cart from Grid
  const handleQuickAddToCart = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.isCustomizable) {
      // Open modal for customization inputs
      setSelectedProduct(product);
    } else {
      handleAddToCart(product, 1);
    }
  };

  // Submit Seller Application
  const handleSubmitSellerApplication = (appData: any) => {
    storageService.submitVendorApplication(appData);
    showToast('Seller Application Submitted', 'Your artisan studio profile is now active on the marketplace!', 'success');
  };

  // Submit Order Placement
  const handlePlaceOrder = (
    recipientName: string,
    email: string,
    phone: string,
    shippingAddress: any,
    paymentMethod: any,
    courierName: string
  ) => {
    const newOrder = storageService.placeOrder(
      recipientName,
      email,
      phone,
      shippingAddress,
      paymentMethod,
      courierName
    );

    showToast('Order Placed Successfully!', `Transaction CUID: ${newOrder.id}`, 'success');
    return newOrder;
  };

  // Update Vendor Order Status
  const handleUpdateOrderStatus = (
    orderId: string,
    vendorOrderId: string,
    status: OrderStatus,
    trackingNumber?: string
  ) => {
    storageService.updateVendorOrderStatus(orderId, vendorOrderId, status, trackingNumber);
    showToast('Order Status Updated', `Order set to ${status}.`, 'info');
  };

  // Add Review
  const handleAddReview = (productId: string, rating: number, title: string, comment: string) => {
    const prod = products.find(p => p.id === productId);
    const vendorProfileId = prod?.vendorProfileId || 'v_dhamrai_pottery';
    const orderItemId = `item_${Date.now()}`;
    try {
      storageService.submitReview(
        currentUser.id,
        currentUser.name,
        currentUser.avatarUrl,
        productId,
        vendorProfileId,
        orderItemId,
        rating,
        title,
        comment
      );
      showToast('Review Submitted', 'Thank you for your verified artisan feedback!', 'success');
    } catch (err: any) {
      showToast('Review Submitted', err.message || 'Review recorded.', 'info');
    }
  };

  // Filter products for homepage explore grid
  const filteredProducts = products.filter(p => {
    const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
    const matchesSearch = !searchQuery || 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredProducts = filteredProducts.filter(p => p.isFeatured || true);
  const wishlistProductObjects = products.filter(p => wishlist.includes(p.id));
  const activeVendor = vendors.find(v => v.ownerUserId === currentUser.id) || vendors[0];

  return (
    <div className="min-h-screen bg-[#fcfaf7] text-stone-800 flex flex-col font-sans selection:bg-amber-900 selection:text-amber-100">
      
      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />

      {/* Main Header */}
      <Header
        currentUser={currentUser}
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        wishlistCount={wishlist.length}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenCart={() => setCartDrawerOpen(true)}
        onOpenAdvisor={() => setAdvisorModalOpen(true)}
        onRoleChange={handleRoleChange}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
      />

      {/* VIEW 1: EXPLORE / HOMEPAGE */}
      {activeView === 'explore' && (
        <main className="flex-1 space-y-12 pb-16">
          
          {/* Hero Banner */}
          <Hero
            onExploreCrafts={() => {
              const el = document.getElementById('handcrafted-catalog');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            onOpenRawMaterials={() => setActiveView('raw_materials')}
            onOpenAdvisor={() => setAdvisorModalOpen(true)}
            onSelectCategory={(catId) => setActiveCategory(catId)}
          />

          {/* Curated Etsy-Style Sections (Home Improvement, Local Shops, Birthday Gifts) */}
          <EtsyCuratedSections
            onSelectVendor={handleSelectVendor}
            onSelectProduct={(p) => setSelectedProduct(p)}
            onExploreCrafts={() => {
              const el = document.getElementById('handcrafted-catalog');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            products={products}
            vendors={vendors}
          />

          {/* Main Handcrafted Catalog */}
          <section id="handcrafted-catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
              <div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
                  {activeCategory === 'all' ? 'Featured Handcrafted Collection' : `${activeCategory.replace('_', ' ').toUpperCase()} Crafts`}
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Showing {filteredProducts.length} authentic, made-to-order crafts directly from Bangladeshi artisans.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-stone-500">View Mode:</span>
                <span className="font-bold text-amber-950 bg-amber-100 px-2.5 py-1 rounded-full">
                  Multi-Vendor Marketplace
                </span>
              </div>
            </div>

            {/* Category Filter Pills Section */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 pt-1 border-b border-[#2E2A25]/15">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#C85A32] shrink-0 mr-1 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-[#C85A32]" /> Categories:
              </span>
              {[
                { id: 'all', label: 'All Crafts' },
                { id: 'pottery', label: 'Pottery & Clay' },
                { id: 'textiles', label: 'Jamdani & Textiles' },
                { id: 'woodwork', label: 'Teak & Woodcraft' },
                { id: 'glass_resin', label: 'Resin & Botanical' },
                { id: 'jewelry', label: 'Silver & Metalsmith' },
                { id: 'paintings', label: 'Rickshaw & Folk Art' },
                { id: 'leatherwork', label: 'Heritage Leather' },
                { id: 'custom_gifts', label: 'Bespoke Keepsakes' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    activeCategory === cat.id
                      ? 'bg-[#C85A32] text-white shadow-xs'
                      : 'bg-[#F4EBE1] text-[#2E2A25] hover:bg-stone-200 border border-[#2E2A25]/10'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Product Grid */}
            {filteredProducts.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-stone-200 space-y-3">
                <Search className="w-10 h-10 text-stone-300 mx-auto" />
                <p className="text-stone-700 font-serif font-bold text-base">No crafts matched your search</p>
                <p className="text-xs text-stone-500">Try clearing filters or search terms.</p>
                <button
                  onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
                  className="px-4 py-2 bg-stone-900 text-white text-xs font-semibold rounded-xl hover:bg-stone-800 cursor-pointer"
                >
                  Clear Search Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isWishlisted={wishlist.includes(product.id)}
                    onToggleWishlist={handleToggleWishlist}
                    onSelectProduct={(p) => setSelectedProduct(p)}
                    onQuickAddToCart={handleQuickAddToCart}
                    onSelectVendor={handleSelectVendor}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Raw Materials Teaser Banner */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="p-8 bg-gradient-to-r from-emerald-950 to-stone-900 text-emerald-100 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                  <Layers className="w-4 h-4" /> Wholesale Marketplace for Craftsmen
                </span>
                <h3 className="font-serif text-2xl font-bold text-white">
                  Need Raw Clay, Seasoned Teak, or Mulberry Silk Yarn?
                </h3>
                <p className="text-xs text-emerald-200/80 leading-relaxed">
                  Artisans and makers can source raw craft materials in bulk wholesale prices directly from verified suppliers.
                </p>
              </div>
              <button
                onClick={() => setActiveView('raw_materials')}
                className="px-6 py-3 bg-emerald-800 hover:bg-emerald-700 text-emerald-50 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-lg shrink-0"
              >
                Open Wholesale Raw Materials Market
              </button>
            </div>
          </section>
        </main>
      )}

      {/* VIEW 2: RAW MATERIALS */}
      {activeView === 'raw_materials' && (
        <main className="flex-1">
          <RawMaterialsPage
            currentUser={currentUser}
            onNavigateToSignup={() => setActiveView('seller_signup')}
            onShowToast={showToast}
          />
        </main>
      )}

      {/* VIEW 3: SELLER APPLICATION / SIGNUP */}
      {activeView === 'seller_signup' && (
        <main className="flex-1">
          <SellerSignupPage
            existingVendor={vendors.find(v => v.ownerUserId === currentUser.id)}
            onSubmitApplication={handleSubmitSellerApplication}
            onGoToDashboard={() => setActiveView('seller_dashboard')}
          />
        </main>
      )}

      {/* VIEW 4: BUYER PROFILE & ORDERS */}
      {activeView === 'buyer_profile' && (
        <main className="flex-1">
          <BuyerProfileView
            user={currentUser}
            orders={orders}
            wishlistProducts={wishlistProductObjects}
            onToggleWishlist={handleToggleWishlist}
            onSelectProduct={(p) => setSelectedProduct(p)}
            onQuickAddToCart={handleQuickAddToCart}
            onShowToast={(type, title, msg) => showToast(title, msg, type)}
          />
        </main>
      )}

      {/* VIEW 5: SELLER DASHBOARD */}
      {activeView === 'seller_dashboard' && (
        <main className="flex-1">
          <SellerDashboardView
            vendorProfile={activeVendor}
            products={products}
            orders={orders}
            settlements={settlements}
            onAddProduct={(prod) => {
              storageService.addProduct(prod);
              showToast('Product Listing Published', `"${prod.title}" is now live on the marketplace.`, 'success');
            }}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onApplySeller={() => setActiveView('seller_signup')}
          />
        </main>
      )}

      {/* VIEW 6: ADMIN DASHBOARD */}
      {activeView === 'admin_dashboard' && (
        <main className="flex-1">
          <AdminDashboardView
            onShowToast={(type, title, message) => showToast(title, message, type)}
          />
        </main>
      )}

      {/* VIEW 7: SHIPPING & COURIER MANAGEMENT */}
      {activeView === 'shipping' && (
        <main className="flex-1">
          <ShippingManagementPage
            currentUser={currentUser}
            onShowToast={(type, title, message) => showToast(title, message, type)}
          />
        </main>
      )}

      {/* VIEW 8: VENDOR / SAMPLE SHOP PAGE */}
      {activeView === 'vendor_shop' && (
        <main className="flex-1">
          {(() => {
            const currentVendor = vendors.find(v => v.id === selectedVendorId) || vendors[0];
            return (
              <VendorShopView
                vendor={currentVendor}
                products={products}
                reviews={reviews}
                wishlist={wishlist}
                onToggleWishlist={handleToggleWishlist}
                onSelectProduct={(p) => setSelectedProduct(p)}
                onQuickAddToCart={handleQuickAddToCart}
                onOpenAdvisor={() => setAdvisorModalOpen(true)}
                onBack={() => setActiveView('explore')}
                onShowToast={(title, msg, type) => showToast(title, msg, type)}
              />
            );
          })()}
        </main>
      )}

      {/* MODAL: Product Detail & Customization View */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          reviews={reviews}
          isWishlisted={wishlist.includes(selectedProduct.id)}
          onClose={() => setSelectedProduct(null)}
          onToggleWishlist={(id) => handleToggleWishlist(id)}
          onAddToCart={handleAddToCart}
          onAddReview={handleAddReview}
          onSelectVendor={handleSelectVendor}
        />
      )}

      {/* DRAWER: Cart */}
      <CartDrawer
        isOpen={cartDrawerOpen}
        cart={cart}
        onClose={() => setCartDrawerOpen(false)}
        onUpdateQuantity={(id, qty) => storageService.updateCartQuantity(id, qty)}
        onRemoveItem={(id) => storageService.removeFromCart(id)}
        onProceedToCheckout={() => {
          setCartDrawerOpen(false);
          setCheckoutModalOpen(true);
        }}
      />

      {/* MODAL: Multi-step Checkout */}
      <CheckoutModal
        isOpen={checkoutModalOpen}
        cart={cart}
        onClose={() => setCheckoutModalOpen(false)}
        onOrderPlaced={handlePlaceOrder}
      />

      {/* MODAL: Gemini AI Craft Advisor */}
      <CraftAdvisorModal
        isOpen={advisorModalOpen}
        onClose={() => setAdvisorModalOpen(false)}
      />

      {/* Footer */}
      <Footer
        onApplySeller={() => setActiveView('seller_signup')}
        onOpenRawMaterials={() => setActiveView('raw_materials')}
      />
    </div>
  );
}
