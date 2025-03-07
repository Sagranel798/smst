const express = require('express');
const mongoose = require('mongoose');
const app = express();
const port = 3000;

// 连接 MongoDB Atlas
mongoose.connect('mongodb+srv://<username>:<password>@<cluster-url>/stock_management?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB Atlas');
});

// ... existing code ...
app.use(express.static('public'));
// ... existing code ...

// 定义库存模型
const inventorySchema = new mongoose.Schema({
    name: String,
    quantity: Number
});

const Inventory = mongoose.model('Inventory', inventorySchema);

// 解析 JSON 数据
app.use(express.json());

// 获取所有库存信息
app.get('/api/inventory', async (req, res) => {
    try {
        const inventory = await Inventory.find();
        res.json(inventory);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 添加库存信息
app.post('/api/inventory', async (req, res) => {
    const { name, quantity } = req.body;
    try {
        const newItem = new Inventory({ name, quantity });
        await newItem.save();
        res.status(201).json({ message: 'Inventory item added successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 启动服务器
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});