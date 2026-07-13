var express = require('express');
var router = express.Router();
const Product = require('../models/Product'); // মডেলটি ইম্পোর্ট করলাম
const Order = require('../models/Order'); // মড েলট ি ইম





/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});





// 🛡 ️ স িম ্পল স েশন গ ার ্ড
function isAdmin(req, res, next) {
    // স েশন ে যদ ি admin এর ম ান true থ াক ে, তব েই ঢ ুকত ে দ েব ে
    if (req.session && req.session.admin === true) {
        return next();
    }
    // ন া থ াকল ে প াসওয় ার ্ড দ েওয় ার প েজ ে র িড াইর েক ্ট করব ে
    res.redirect('/admin-login');
}






router.get('/admin/manage',isAdmin, (req, res) => {
    try {
        res.render('manage-products', { title: 'Manage Inventory' });
    } catch (error) {
        console.error('Render Manage Page Error:', error);
        res.status(500).send('Internal Server Error');
    }
});

/**
 * ২. প্রোডাক্ট ডিলিট করার API রাউট
 * URL: http://localhost:3000/products/api/delete/:id
 */
router.delete('/products/api/delete/:id',isAdmin, async (req, res) => {
    try {
        const productId = req.params.id;
        const deletedProduct = await Product.findByIdAndDelete(productId);

        if (!deletedProduct) {
            return res.status(404).json({ success: false, message: 'Product not found!' });
        }

        res.status(200).json({ success: true, message: 'Product deleted successfully.' });
    } catch (error) {
        console.error('Delete API Error:', error);
        res.status(500).json({ success: false, message: 'Server error processing deletion.' });
    }
});





router.get('/more', function(req, res, next) {
  res.render('more');
});




router.get('/cart', function(req, res, next) {
  res.render('cart');
});


router.get('/add',isAdmin, function(req, res) {
  res.render('add',{status:''});
});

router.post('/add',isAdmin, async (req, res) => {
  try {
    // ফর্ম থেকে আসা ডেটা রিসিভ করা
    let { name,price, bio, images, category, isDiscount, discountPrice, isNewArrival } = req.body;

    // ১. ইমেজ ফিল্টারিং: ইউজার যদি অপশনাল ইমেজ খালি রাখে, তবে ফাঁকা স্ট্রিংগুলো রিমুভ করে দেওয়া
    if (Array.isArray(images)) {
      images = images.filter(url => url.trim() !== "");
    }

    // ২. চেক বক্স হ্যান্ডেলিং: ফর্মে টিক দিলে 'true' (string) আসে, সেটাকে Boolean (true/false) করা
    isDiscount = isDiscount === 'true';
    isNewArrival = isNewArrival === 'true';

    // ৩. ডিসকাউন্ট না থাকলে discountPrice নাল (null) করে দেওয়া
    if (!isDiscount) {
      discountPrice = null;
    }

    // নতুন প্রোডাক্টের অবজেক্ট তৈরি
    const newProduct = new Product({
      name,
      bio,
      images,
      category,
      price,
      isDiscount,
      discountPrice,
      isNewArrival
    });

    // ডাটাবেজে সেভ করা
    await newProduct.save();

    // সফলভাবে সেভ হলে রিডাইরেক্ট বা মেসেজ পাঠানো (আপনার ইচ্ছা অনুযায়ী পরিবর্তন করতে পারেন)
    res.render("add",{status:'add successful'});
    
  } catch (error) {
    console.error("Error saving product:", error);
    res.render("add",{status:'not add some problem!'});
    
    
    res.status(500).send("Server Error: Product match or saving failed.");
  }
});









// ১. মেইন পেজ রেন্ডার করার রাউট (শুধু পেজ লোড হবে)
router.get('/all', (req, res) => {
  res.render('all-products'); 
});

// ২. পিওর এপিআই রাউট: এটি কোনো কোড বানাবে না, শুধু ডেটা (JSON) ছুড়ে দেবে
router.get('/products/api/load-infinite', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const skip = parseInt(req.query.skip) || 0;

    const products = await Product.find().sort({ createdAt: -1 }).skip(skip).limit(limit);
    res.json(products); // ফ্রন্টএন্ডের জন্য পিওর JSON ডেটা রেসপন্স
  } catch (error) {
    res.status(500).json({ error: "Server Error" });
  }
});

 



  





router.get('/search', (req, res) => {
    try {
        res.render('search', { title: 'Search Products' });
    } catch (error) {
        console.error('Render Search Page Error:', error);
        res.status(500).send('Internal Server Error');
    }
});

/**
 * ২. পিওর র-ডেটা প্রোভাইডার API রাউট (ফ্রন্টএন্ড ফিল্টারিংয়ের জন্য)
 * URL: http://localhost:3000/products/api/all-raw
 */
router.get('/products/api/all-raw', async (req, res) => {
    try {
        // ডাটাবেজ থেকে সব প্রোডাক্টের শুধু ফ্রন্টএন্ডে প্রয়োজনীয় ফিল্ডগুলো একবারে তুলে আনা
        const products = await Product.find({})
            .select('_id name price isDiscount discountPrice isNewArrival category images bio')
            .sort({ createdAt: -1 }); // নতুনগুলো আগে দেখাবে

        // সরাসরি JSON রেসপন্স পাঠানো
        res.status(200).json(products);
    } catch (error) {
        console.error('All-Raw API Error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching store inventory.' });
    }
});











router.get('/products/details/:id', async (req, res) => {
    try {
        const productId = req.params.id;

        // আইডি ভ্যালিড কিনা চেক করা (ভুল আইডিতে ক্র্যাশ এড়াতে)

        // ডাটাবেজ থেকে সিঙ্গেল প্রোডাক্ট খুঁজে বের করা
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).send('Product Not Found');
        }

        // প্রোডাক্ট ডাটা সহ ইজেএস পেজ রেন্ডার
        res.render('product-details', { 
            title: product.name, 
            product: product 
        });

    } catch (error) {
        console.error('Fetch Product Details Error:', error);
        res.status(500).send('Internal Server Error');
    }
});





// checkout পেজ ভিউ করার রাউট
router.get('/checkout', (req, res) => {
    try {
        res.render('checkout', { title: 'Checkout' });
    } catch (error) {
        console.error('Render Checkout Page Error:', error);
        res.status(500).send('Internal Server Error');
    }
});

// অর্ডার প্লেস করার API রাউট
router.post('/api/orders/place', async (req, res) => {
    try {
        const { name, phone, email, address, items, totalAmount } = req.body;

        // ভ্যালিডেশন চেক
        if (!name || !phone || !address || !items || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Required fields are missing.' });
        }
        
        
        
        function generateNumericOrderId() {
    // ১০_০০_০০ থেকে ৯৯_৯৯_৯৯ এর মধ্যে একটি সংখ্যা তৈরি করবে যা সবসময় ৬ সংখ্যার হবে
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// আপনার কোডে যেভাবে ব্যবহার করবেন:
const orderId = generateNumericOrderId();

        
        

        // এখানে আপনার Order Model থাকলে ডাটাবেজে সেভ করবেন, যেমন:
         const newOrder = new Order({ name,orderId, 
         phone, email, address, items,
          totalAmount, status: 'Pending',
          statusHistory: [{ 
        status: 'Pending', 
        changedAt: new Date() 
    }] 
          
           });
         await newOrder.save();
        
        console.log('New Order Received:', { name, phone, email, address, items, totalAmount });

        // সাকসেস রেসপন্স
        res.status(200).json({ success: true, message: 'Order placed successfully!',orderId:orderId });
    } catch (error) {
        console.error('Order Placement API Error:', error);
        res.status(500).json({ success: false, message: 'Server error processing your order.' });
    }
});










router.get('/admin/orders',isAdmin, async (req, res) => {
    try {
        // নতুন অর্ডারগুলো সবার উপরে দেখানোর জন্য sort করা হয়েছে
        const orders = await Order.find({}).sort({ createdAt: -1 });
        res.render('admin-orders', { title: 'Manage Orders', orders });
    } catch (error) {
        console.error('Render Orders Error:', error);
        res.status(500).send('Internal Server Error');
    }
});







router.post('/admin/api/orders/update-status',isAdmin, async (req, res) => {
    try {
        const { orderId, status } = req.body;

        // স্ট্যাটাস আপডেট করার সাথে সাথে statusHistory অ্যারেতে নতুন অবজেক্ট $push করা হচ্ছে
        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            { 
                status: status,
                $push: { 
                    statusHistory: { 
                        status: status, 
                        changedAt: new Date() // কারেন্ট ডেট ও টাইম
                    } 
                }
            },
            { new: true }
        );

        if (!updatedOrder) {
            return res.status(404).json({ success: false, message: 'Order not found.' });
        }

        res.status(200).json({ success: true, message: 'Status node and time log locked.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error updating tracking telemetry.' });
    }
});






// ওয়ান-ক্লিক অর্ডার ডিলিট API রাউট
router.delete('/admin/api/orders/delete/:id',isAdmin, async (req, res) => {
    try {
        const orderId = req.params.id;
        const deletedOrder = await Order.findByIdAndDelete(orderId);

        if (!deletedOrder) {
            return res.status(404).json({ success: false, message: 'Order already purged or not found.' });
        }

        res.status(200).json({ success: true, message: 'Order successfully deleted from pipeline.' });
    } catch (error) {
        console.error('Delete Order API Error:', error);
        res.status(500).json({ success: false, message: 'Server error wiping order.' });
    }
});





router.get('/order/placed/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        
        // আপনার কাস্টম ৬ সংখ্যার orderId দিয়ে ডেটাবেজে সার্চ করা হচ্ছে
        const order = await Order.findOne({ orderId: orderId.trim() });

        if (!order) {
            // যদি কোনো কারণে অর্ডার খুঁজে না পাওয়া যায়
            return res.status(404).render('error', { message: 'Order reference not found in pipeline telemetry.' });
        }

        // অর্ডার ডেটাসহ সাকসেস পেজ রেন্ডার করা হচ্ছে
        res.render('order-placed', { order });
    } catch (error) {
        console.error('Error fetching placed order:', error);
        res.status(500).send('Internal Pipeline Server Error');
    }
});







// ১. ট্র্যাকিং পেজ ভিউ করার রাউট
router.get('/track', (req, res) => {
    // কোনো আইডি ছাড়া পেজে ঢুকলে অর্ডার ডেটা null থাকবে
    res.render('track-order', { order: null, error: null, searchedId: '' });
});

// ২. ট্র্যাকিং আইডি সাবমিট করার পর হ্যান্ডেল করার রাউট
router.post('/track', async (req, res) => {
    try {
        const { orderId } = req.body;
        
        if (!orderId) {
            return res.render('track-order', { order: null, error: 'Please enter a valid Order ID.', searchedId: '' });
        }

        // ডেটাবেজে আপনার কাস্টম ৬ সংখ্যার orderId ফিল্ড দিয়ে সার্চ করা হচ্ছে
        const order = await Order.findOne({ orderId: orderId.trim() });

        if (!order) {
            return res.render('track-order', { 
                order: null, 
                error: 'No order found with this tracking ID. Please check and try again.', 
                searchedId: orderId 
            });
        }

        // অর্ডার পাওয়া গেলে ডেটাসহ পেজ রেন্ডার হবে
        res.render('track-order', { order, error: null, searchedId: orderId });

    } catch (error) {
        console.error('Order Tracking Error:', error);
        res.render('track-order', { order: null, error: 'Something went wrong on the server.', searchedId: '' });
    }
});




router.get('/category', async (req, res) => {
    try {
        // ডাটাবেজ থেকে শুধু প্রয়োজনীয় ফিল্ডগুলো তুলে আনা হচ্ছে (পারফরম্যান্স ফাস্ট রাখার জন্য)
        const products = await Product.find({})
        
        // 'category' ভিউ রেন্ডার করা হচ্ছে এবং প্রোডাক্টের ডাটা পাঠানো হচ্ছে
        res.render('category', { products });
    } catch (error) {
        console.error("Error fetching items for category grid:", error);
        res.status(500).send("Internal Server Pipeline Error");
    }
});




router.get('/admin/dashboard',isAdmin, async (req, res) => {
    const orders = await Order.find({});
    const products = await Product.find({});
    res.render('dashboard', { orders, products });
});








router.get('/admin-login', (req, res) => {
    res.render('admin-login', { error: null });
});




router.post('/admin-login', (req, res) => {
    const { secretPassword } = req.body;
    const MY_PASSWORD = "mirshop123"; // 👈 আপনার মনের মতো পাসওয়ার্ড এখানে দিন

    if (secretPassword === MY_PASSWORD) {
        req.session.admin = true; // ✅ সেশন সেট হয়ে গেল!
        return res.redirect('/admin/dashboard'); // ড্যাশবোর্ডে পাঠিয়ে দাও
    } else {
        return res.send("<script>alert('ভুল পাসওয়ার্ড!'); window.location='/admin-login';</script>");
    }
});








router.get('/logout', (req, res) => {
    req.session.admin = false; // সেশন ধ্বংস
    res.redirect('/admin-login');
});



module.exports = router;
