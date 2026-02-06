import express from 'express';

const app = express();
const PORT = 4000;

app.get('/', (req, res) => {
  res.json({ hello: 'world' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Test server running on port ${PORT}`);
}).on('error', (err) => {
  console.error('Server error:', err);
});

// Print all listeners
const server = app._router.stack;
console.log('Routes registered');
