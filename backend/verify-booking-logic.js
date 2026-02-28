const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';
const API = axios.create({ baseURL: BASE_URL });

async function runTests() {
    console.log('🚀 Starting Booking Logic Verification...\n');

    try {
        // 1. Get initial data (we'll use the first service, staff, and user)
        const [servicesRes, staffRes, usersRes] = await Promise.all([
            API.get('/admin/services'),
            API.get('/admin/staff'),
            API.get('/admin/users')
        ]);

        const services = servicesRes.data.data;
        const staffList = staffRes.data.data;
        const users = usersRes.data.data.users;

        let service = services[0];
        let staff = null;
        let user = users?.[0];

        // Find a staff-service pair that actually works
        for (const s of services) {
            staff = staffList.find(st => st.services.some(svc => (svc._id || svc).toString() === s._id.toString()));
            if (staff) {
                service = s;
                break;
            }
        }

        // If no user exists, create a test customer
        if (!user) {
            console.log('ℹ️  No users found. Creating a test customer...');
            const newUserRes = await API.post('/users', {
                name: 'Test Customer',
                email: `test_${Date.now()}@example.com`,
                phone: '9876543210'
            });
            user = newUserRes.data.data;
        }

        if (!service || !staff || !user) {
            console.error('❌ Error: Could not prepare test data.');
            console.log('- Service:', !!service);
            console.log('- Staff:', !!staff);
            console.log('- User:', !!user);
            return;
        }

        console.log(`Testing with:\n- User: ${user.name}\n- Staff: ${staff.name}\n- Service: ${service.name} (${service.duration} mins)\n`);

        const testDate = new Date();
        testDate.setDate(testDate.getDate() + 7); // 7 days from now to ensure we're not in the past
        const dateStr = testDate.toISOString().split('T')[0];

        const scenarios = [
            {
                name: '1. Valid Unique Booking (10:00 AM)',
                payload: { userId: user._id, serviceId: service._id, staffId: staff._id, date: dateStr, startTime: '10:00' },
                expectedStatus: 201
            },
            {
                name: '2. Exact Overlap (10:00 AM)',
                payload: { userId: user._id, serviceId: service._id, staffId: staff._id, date: dateStr, startTime: '10:00' },
                expectedStatus: 409
            },
            {
                name: '3. Partial Start Overlap (09:45 AM - overlaps until 10:15)',
                payload: { userId: user._id, serviceId: service._id, staffId: staff._id, date: dateStr, startTime: '09:45' },
                expectedStatus: 409
            },
            {
                name: '4. Partial End Overlap (10:15 AM - overlaps with 10:00 start)',
                payload: { userId: user._id, serviceId: service._id, staffId: staff._id, date: dateStr, startTime: '10:15' },
                expectedStatus: 409
            },
            {
                name: '5. Back-to-Back (Starts exactly when previous ends)',
                payload: {
                    userId: user._id,
                    serviceId: service._id,
                    staffId: staff._id,
                    date: dateStr,
                    startTime: '10:30' // Assuming 30m service duration
                },
                expectedStatus: 201
            },
            {
                name: '6. Outside Working Hours (05:00 AM)',
                payload: { userId: user._id, serviceId: service._id, staffId: staff._id, date: dateStr, startTime: '05:00' },
                expectedStatus: 400
            }
        ];

        // Adjust back-to-back start time based on actual duration
        scenarios[4].payload.startTime = formatTime(10 * 60 + service.duration);

        for (const scenario of scenarios) {
            try {
                console.log(`Running ${scenario.name}...`);
                const res = await API.post('/bookings', scenario.payload);
                if (res.status === scenario.expectedStatus) {
                    console.log(`✅ PASS: Status ${res.status}\n`);
                } else {
                    console.log(`❌ FAIL: Expected ${scenario.expectedStatus}, got ${res.status}\n`);
                }
            } catch (err) {
                const status = err.response?.status;
                if (status === scenario.expectedStatus) {
                    console.log(`✅ PASS: Status ${status}\n`);
                } else {
                    console.log(`❌ FAIL: Expected ${scenario.expectedStatus}, got ${status}\n`);
                    console.log(`Message: ${err.response?.data?.message || err.message}\n`);
                }
            }
        }

    } catch (err) {
        console.error('❌ Fatal error during verification:', err.message);
    }
}

function formatTime(totalMins) {
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

runTests();
