const bcrypt = require('bcryptjs');

async function test() {
    const password = 'hoodal123';
    const hash = await bcrypt.hash(password, 10);
    console.log('Hash:', hash);
    const result = await bcrypt.compare(password, hash);
    console.log('Match:', result);
    
    // Test matching a known hash from the seed (if I could see it)
    // But anyway, this confirms the library works.
}

test();
