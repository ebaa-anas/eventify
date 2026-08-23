import { hashPassword, verifyPassword } from './password.ts';

const plain = 'ahmed123456789';

console.log('1) Hashing the password...');
const hash = await hashPassword(plain);
console.log('   Hash:', hash);

console.log('\n2) Verifying with the CORRECT password...');
const correct = await verifyPassword(hash, plain);
console.log('   Result:', correct);

console.log('\n3) Verifying with the WRONG password...');
const wrong = await verifyPassword(hash, 'wrongPassword123');
console.log('   Result:', wrong);

console.log('\n4) Verifying against a MALFORMED hash...');
const malformed = await verifyPassword('not-a-real-hash', plain);
console.log('   Result:', malformed);