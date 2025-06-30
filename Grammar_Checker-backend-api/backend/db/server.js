// backend/server.js
const express = require('express');
const app = express();
require('./db/database'); // Kết nối DB

const grammarRoutes = require('./routes/grammar');
app.use(express.json());
app.use('/api/grammar', grammarRoutes);

app.listen(3000, () => console.log('🚀 Server on http://localhost:3000'));
