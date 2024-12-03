import express from "express";
import dotenv from "dotenv";
import Stripe from "stripe";
import morgan from "morgan";

dotenv.config();

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(morgan("dev"));

const PORT = process.env.PORT || 1000;

if (!process.env.BASE_URL) {
    console.error("BASE_URL is not defined in .env file. Please add it!");
    process.exit(1);
}

// Sample product data with initial prices
let products = [
    { id: 1, name: "Shopping Cart with Node.js", price: 50 },
    { id: 2, name: "Shopping Cart with React.js", price: 50 },
    { id: 3, name: "Shopping Cart with Svelte.js", price: 50 },
    { id: 4, name: "Shopping Cart with Next.js", price: 50 },
]
app.get("/api/products", (req, res) => {
    try {
        res.json(products);
    } catch (error) {
        console.error("Error fetching product data:", error);
        res.status(500).send("Error fetching product data.");
    }
});


app.put("/api/products/:id", (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        const newPrice = parseFloat(req.body.price);

      
        const product = products.find(p => p.id === productId);
        if (!product) {
            return res.status(404).send("Product not found.");
        }

        product.price = newPrice;
        res.status(200).json({ message: "Product price updated successfully.", product });
    } catch (error) {
        console.error("Error updating product price:", error);
        res.status(500).send("Error updating product price.");
    }
});

app.get("/", (req, res) => {
    res.render("index", { products });
});

app.post("/checkout", async (req, res) => {
    try {
        const cartItems = JSON.parse(req.body.cartItems);

        const lineItems = cartItems.map(item => ({
            price_data: {
                currency: "usd",
                product_data: {
                    name: item.name,
                    images: ["https://example.com/image.jpg"], 
                },
                unit_amount: item.price * 100, 
            },
            quantity: item.quantity,
        }));

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: lineItems,
            mode: "payment",
            success_url: `${process.env.BASE_URL}/complete`,
            cancel_url: `${process.env.BASE_URL}/cancel`,
        });

        res.redirect(session.url);
    } catch (error) {
        console.error("Stripe Checkout Error:", error);
        res.status(500).send("Error creating checkout session.");
    }
});

app.get("/complete", (req, res) => {
    res.send("Your payment was successfully processed!");
});

app.get("/cancel", (req, res) => {
    res.send("Payment canceled.");
});

app.get("/status", (req, res) => {
    res.send("Server is running.");
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Something went wrong!");
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

