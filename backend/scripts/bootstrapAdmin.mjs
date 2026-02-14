async function run() {
  try {
    const res = await fetch('http://localhost:4000/api/auth/bootstrap-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'krishna@108', templeName: 'Main' })
    });
    const body = await res.text();
    console.log('status', res.status);
    console.log('body', body);
  } catch (err) {
    console.error('ERROR', err);
    process.exit(1);
  }
}

run();
