async function run() {
  try {
    const res = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'secret' })
    });
    const data = await res.json();
    console.log('status', res.status);
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('ERROR', err);
    process.exit(1);
  }
}

run();
