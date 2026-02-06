import express from 'express';

const app = express();
const PORT = 4000;

app.get('/', (req, res) => {
  res.json({ hello: 'world' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Test server running on port ${PORT}`);
});
