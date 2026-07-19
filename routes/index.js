



var express = require('express');
var router = express.Router();
const Product = require('../models/Product'); // মডেলটি ইম্পোর্ট করলাম
const Order = require('../models/Order'); // মড েলট ি ইম
const numberToWords = require('number-to-words');

const path = require('path');
const fs = require('fs');
const { PDFDocument, rgb } = require('pdf-lib');

const fontkit = require('fontkit');

/* GET home page. */

router.get('/', async (req, res) => {
    try {
        // হোমপেজের জন্য আমরা সর্বোচ্চ ৩০ বা ৪০টি প্রোডাক্ট তুলে নিয়ে আসব
        const homepageProducts = await Product.find({}).sort({ createdAt: -1 }).limit(40);
        res.render('index', { products: homepageProducts });
    } catch (err) {
        console.error(err);
        res.render('index', { products: [] });
    }
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
    res.render("add",{status:'product added successful'});
    
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
    const MY_PASSWORD = process.env.MY_PASSWORD; // 👈 আপনার মনের মতো পাসওয়ার্ড এখানে দিন

    if (secretPassword === MY_PASSWORD) {
        req.session.admin = true; // ✅ সেশন সেট হয়ে গেল!
        return res.redirect('/admin/dashboard'); // ড্যাশবোর্ডে পাঠিয়ে দাও
    } else {
        return res.send("<script>alert('ভুল পাসওয়ার্ড!'); window.location='/admin-login';</script>");
    }
});









router.get('/admin/orders/download-memo/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).send('Order not found');

        const imagePath = path.join(__dirname, '../public/mirmemo.jpeg');
        if (!fs.existsSync(imagePath)) return res.status(500).send('Memo base image not found');
        const imageBytes = fs.readFileSync(imagePath);

        const fontPath = path.join(__dirname, '../public/fonts/kalpurush.ttf');
        if (!fs.existsSync(fontPath)) return res.status(500).send('Bangla font file not found');
        const fontBytes = fs.readFileSync(fontPath);

        const pdfDoc = await PDFDocument.create();
        pdfDoc.registerFontkit(fontkit);
        
        const banglaFont = await pdfDoc.embedFont(fontBytes);
        
        const invoiceImage = await pdfDoc.embedJpg(imageBytes);
        const page = pdfDoc.addPage([invoiceImage.width, invoiceImage.height]);
        
        page.drawImage(invoiceImage, { x: 0, y: 0, width: invoiceImage.width, height: invoiceImage.height });
        
        const H = invoiceImage.height;

        page.drawText(`${order.orderId}`, { x: 160, y: H - 314, size: 24, font: banglaFont });
        
        const orderDate = new Date(order.createdAt).toLocaleDateString('en-GB');
        page.drawText(`${orderDate}`, { x: 650, y: H - 314, size: 26, font: banglaFont });

        page.drawText(`${order.name}`, { x: 260, y: H - 390, size: 30, font: banglaFont });
        page.drawText(`${order.phone}`, { x: 630, y: H - 390, size: 30, font: banglaFont });
        page.drawText(`${order.address}`, { x: 170, y: H - 430, size: 25, font: banglaFont });

        let currentY = H - 533;
        const rowHeight = 40.5;

        order.items.forEach((item, index) => {
            if (index < 10) {
                const serialNo = (index + 1).toString();
                
                page.drawText(item.name, { x: 120, y: currentY, size: 26, font: banglaFont });
                page.drawText(item.quantity.toString(), { x: 460, y: currentY, size: 26, font: banglaFont });
                page.drawText(item.price.toString(), { x: 540, y: currentY, size: 26, font: banglaFont });
                
                const itemTotal = (item.price * item.quantity).toString();
                page.drawText(itemTotal, { x: 700, y: currentY, size: 26, font: banglaFont });

                currentY -= rowHeight;
            }
        });

        page.drawText(`${order.totalAmount}`, { x: 640, y: H - 924, size: 26, font: banglaFont });
        
        const discount = order.discount || 0;
        page.drawText(`${discount}`, { x: 640, y: H - 964, size: 26, font: banglaFont });
        
        const deliveryCharge = 100;
        page.drawText(`${deliveryCharge}`, { x: 640, y: H - 1000, size: 26, font: banglaFont });
        
        
        
        
        
        page.drawText(`${order.totalAmount}`, { x: 640, y: H - 1040, size: 26, font: banglaFont, color: rgb(0.85, 0.2, 0) });


// ১. সংখ্যাকে কথায় রূপান্তর করে প্রথম অক্ষর বড় হাতের (Capitalized) করা
const amountInWords = numberToWords.toWords(order.totalAmount);
const capitalizedWords = amountInWords.charAt(0).toUpperCase() + amountInWords.slice(1);
const finalTotal = `${capitalizedWords}`;

page.drawText(finalTotal, { x: 240, y: H - 1080, size: 26,
 font: banglaFont, color: rgb(0.0, 0.4, 0.2)
 });

        const pdfBytes = await pdfDoc.save();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=ShopMemo_${order.orderId}.pdf`);
        res.send(Buffer.from(pdfBytes));
        

    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});



router.get('/logout', (req, res) => {
    req.session.admin = false; // সেশন ধ্বংস
    res.redirect('/admin-login');
});



module.exports = router;
