const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';
const API = axios.create({ baseURL: BASE_URL });

async function fetchIds() {
    try {
        console.log('--- SERVICES ---');
        const servicesRes = await API.get('/services');
        const services = servicesRes.data.data.slice(0, 3);
        services.forEach(s => console.log(`ID: ${s._id} | Name: ${s.name} | Price: ₹${s.price}`));

        console.log('\n--- STAFF ---');
        const staffRes = await API.get('/admin/staff');
        const staff = staffRes.data.data.slice(0, 3);
        staff.forEach(s => console.log(`ID: ${s._id} | Name: ${s.name} | Specialization: ${s.specialization}`));

        console.log('\n--- USERS ---');
        const usersRes = await API.get('/admin/users');
        const users = usersRes.data.data.users.slice(0, 3);
        users.forEach(u => console.log(`ID: ${u._id} | Name: ${u.name} | Email: ${u.email}`));

    } catch (err) {
        console.error('Error fetching IDs:', err.response?.data || err.message);
    }
}

fetchIds();
