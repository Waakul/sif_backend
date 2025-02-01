import express from 'express';
import 'dotenv/config';

const app = express();

app.get('/', (req, res) => {
  res.send('WElcome To da api!');
});

app.listen(2000, () => {
  console.log('Server is running on http://localhost:2000 with PID ' + process.pid);
});