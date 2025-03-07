const express = require('express');
const mongoose = require('mongoose');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;

// ... existing code ...
app.use(express.static('public'));
// ... existing code ...

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
        io.emit('inventoryUpdated'); // 通知所有客户端库存信息已更新
        res.status(201).json({ message: 'Inventory item added successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 处理客户端连接
io.on('connection', (socket) => {
    console.log('A user connected');
    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

// 启动服务器
http.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

// 添加库存信息
app.post('/api/inventory', async (req, res) => {
    const { name, quantity } = req.body;
    try {
        const newItem = new Inventory({ name, quantity });
        // 保存新的库存项到数据库
        await newItem.save();
        // 通过 Socket.IO 向所有连接的客户端发送库存更新事件
        io.emit('inventoryUpdated'); 
        res.status(201).json({ message: 'Inventory item added successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 导出库存信息到 Excel
app.get('/api/inventory/export', async (req, res) => {
    try {
        const inventory = await Inventory.find();
        const ws = XLSX.utils.json_to_sheet(inventory);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Inventory');
        const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
        res.setHeader('Content-Disposition', 'attachment; filename=inventory.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 导入 Excel 文件到库存信息
app.post('/api/inventory/import', async (req, res) => {
    try {
        // 这里需要处理文件上传，可使用 multer 等库
        // 读取文件内容并解析为 JSON
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(worksheet);
        // 将数据保存到数据库
        await Inventory.insertMany(data);
        io.emit('inventoryUpdated');
        res.status(200).json({ message: 'Inventory data imported successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});