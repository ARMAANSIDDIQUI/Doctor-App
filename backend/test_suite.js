require('dotenv').config();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const axios = require('axios');

// Import app
const app = require('./index');

// Models
const Admin = require('./Model/Admin');
const Operator = require('./Model/Operator');
const DoctorDB = require('./Model/Doctor');
const Category = require('./Model/Category');
const SubCategory = require('./Model/SubCategory');
const Patient = require('./Model/patient');
const Order = require('./Model/Order');
const Unbilled = require('./Model/Unbilled');
const Counter = require('./Model/Counter');

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://127.0.0.1:${PORT}`;

let adminToken = '';
let operatorToken = '';

// Test summary
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function recordTest(name, passed, details = '') {
  if (passed) {
    testResults.passed++;
    console.log(`[PASS] ${name}`);
  } else {
    testResults.failed++;
    console.error(`[FAIL] ${name} - ${details}`);
  }
  testResults.tests.push({ name, passed, details });
}

async function runTests() {
  console.log('--- STARTING COMPREHENSIVE ENDPOINTS & LOGIC TEST SUITE ---');

  // Wait 1 second for server and DB to be ready
  await new Promise(r => setTimeout(r, 1000));


  const client = axios.create({
    baseURL: BASE_URL,
    validateStatus: () => true, // Don't throw on error status codes
  });

  try {
    // ==========================================
    // 1. AUTH & OPERATOR / ADMIN TESTS
    // ==========================================
    console.log('\n--- Testing Auth & Admin / Operator ---');

    // Create temporary test admin
    const testAdminUser = 'test_admin_' + Date.now();
    const testAdminPass = 'pass12345';
    const hashedAdminPass = await bcrypt.hash(testAdminPass, 10);
    const adminDoc = await Admin.create({ username: testAdminUser, password: hashedAdminPass });

    // Test Admin Login
    let res = await client.post('/admin/api/login', { username: testAdminUser, password: testAdminPass });
    recordTest('Admin Login: Valid credentials', res.status === 200 && !!res.data.token, `Status: ${res.status}`);
    if (res.data?.token) adminToken = res.data.token;

    res = await client.post('/admin/api/login', { username: testAdminUser, password: 'wrongpassword' });
    recordTest('Admin Login: Invalid password -> 400', res.status === 400, `Status: ${res.status}`);

    // Test Operator Creation
    const testOpUser = 'test_op_' + Date.now();
    const testOpPass = 'op123456';
    res = await client.post('/api/operators', { username: testOpUser, password: testOpPass });
    recordTest('Operator Create: Valid', res.status === 201, `Status: ${res.status}`);

    res = await client.post('/api/operators', { username: testOpUser, password: testOpPass });
    recordTest('Operator Create: Duplicate username -> 400', res.status === 400, `Status: ${res.status}`);

    // Test Operator Login
    res = await client.post('/api/login', { username: testOpUser, password: testOpPass });
    recordTest('Operator Login: Valid credentials', res.status === 200 && !!res.data.token, `Status: ${res.status}`);
    if (res.data?.token) operatorToken = res.data.token;

    // Test Operator List
    res = await client.get('/api/operators');
    const createdOp = res.data.find(o => o.username === testOpUser);
    recordTest('Operator List: Returns operators without password', res.status === 200 && createdOp && !createdOp.password, `Status: ${res.status}`);

    // Test Operator Change Password
    res = await client.put(`/api/operators/${createdOp?._id}/password`, { newPassword: 'new_op_pass' });
    recordTest('Operator Change Password: Valid', res.status === 200, `Status: ${res.status}`);

    // Test CheckAuth middleware with NO auth header (verifying no server crash / double send error)
    res = await client.get('/api/checkauth');
    recordTest('CheckAuth: Missing header returns 401 without crashing', res.status === 401, `Status: ${res.status}`);

    // Test CheckAuth with Admin Token
    res = await client.get('/api/checkauth', { headers: { Authorization: `Bearer ${adminToken}` } });
    recordTest('CheckAuth: Valid Admin Token returns role=admin', res.status === 200 && res.data.user?.role === 'admin', `Status: ${res.status}`);

    // Test CheckAuth with Operator Token
    res = await client.get('/api/checkauth', { headers: { Authorization: `Bearer ${operatorToken}` } });
    recordTest('CheckAuth: Valid Operator Token returns role=operator', res.status === 200 && res.data.user?.role === 'operator', `Status: ${res.status}`);

    // ==========================================
    // 2. CATEGORY & SUBCATEGORY TESTS
    // ==========================================
    console.log('\n--- Testing Categories & Subcategories ---');

    const catName = 'TestCat_' + Date.now();
    res = await client.post('/api/addCategory', { name: catName });
    recordTest('Category Add: Valid', res.status === 201 && res.data.category?.name === catName, `Status: ${res.status}`);
    const catId = res.data.category?._id;

    res = await client.post('/api/addCategory', { name: catName });
    recordTest('Category Add: Duplicate -> 400', res.status === 400, `Status: ${res.status}`);

    res = await client.get(`/api/category/${catId}`);
    recordTest('Category Get By ID: Valid', res.status === 200 && res.data.category?.name === catName, `Status: ${res.status}`);

    res = await client.get('/api/categories');
    recordTest('Category Get All: Valid list', res.status === 200 && Array.isArray(res.data.categories), `Status: ${res.status}`);

    const updatedCatName = catName + '_Updated';
    res = await client.put(`/api/category/${catId}`, { name: updatedCatName });
    recordTest('Category Update: Valid', res.status === 200 && res.data.category?.name === updatedCatName, `Status: ${res.status}`);

    // Subcategory Add
    const subCatName = 'TestSubCat_' + Date.now();
    res = await client.post('/api/addSubCategory', {
      name: subCatName,
      category: updatedCatName,
      price: 1500,
      referralFee: 300
    });
    recordTest('SubCategory Add: Valid', res.status === 201 && res.data.category?.name === subCatName, `Status: ${res.status}`);
    const subCatId = res.data.category?._id;

    res = await client.get(`/api/subcategory/${subCatId}`);
    recordTest('SubCategory Get By ID: Valid', res.status === 200 && res.data.category?.price === 1500, `Status: ${res.status}`);

    res = await client.get(`/api/subcategory?category=${encodeURIComponent(updatedCatName)}`);
    recordTest('SubCategory Get By Category: Valid', res.status === 200 && res.data.subcategories?.length > 0, `Status: ${res.status}`);

    res = await client.get('/api/subcategories');
    recordTest('SubCategory Get All: Valid list', res.status === 200 && Array.isArray(res.data.Subcategories), `Status: ${res.status}`);

    res = await client.put(`/api/subcategory/${subCatId}`, {
      name: subCatName + '_Updated',
      category: updatedCatName,
      price: 1800,
      referralFee: 400
    });
    recordTest('SubCategory Update: Valid', res.status === 200 && res.data.category?.price === 1800, `Status: ${res.status}`);

    // ==========================================
    // 3. DOCTOR CRUD & LOGICS
    // ==========================================
    console.log('\n--- Testing Doctor CRUD & Logics ---');

    const docPhone = Math.floor(1000000000 + Math.random() * 9000000000);
    const docName = 'Dr. Test_' + Date.now();
    res = await client.post('/api/doctor/add', {
      name: docName,
      phoneNo: docPhone,
      address: 'Test Clinic Road',
      totalCommission: 0
    });
    recordTest('Doctor Add: Valid', res.status === 200 && res.data.success === true, `Status: ${res.status}`);

    // Fetch doctors to get created doctor ID
    res = await client.get('/api/doctors');
    const createdDoctor = res.data.doctors?.find(d => d.name === docName);
    const doctorId = createdDoctor?._id;
    recordTest('Doctor List: Contains created doctor', !!createdDoctor, `DoctorId: ${doctorId}`);

    // Test 'None' Doctor Add protection
    res = await client.post('/api/doctor/add', {
      name: 'None',
      phoneNo: 1111111111,
      address: 'N/A'
    });
    // If None already exists, should return 409
    recordTest("Doctor Add 'None': Protected against duplicates -> 409", res.status === 409, `Status: ${res.status}`);

    // Test Doctor Get By ID
    res = await client.get(`/api/doctor/${doctorId}`);
    recordTest('Doctor Get By ID: Valid', res.status === 200 && res.data.doctor?.name === docName, `Status: ${res.status}`);

    // Test Doctor Get By ID = 0 (placeholder handler)
    res = await client.get('/api/doctor/0');
    recordTest('Doctor Get By ID: "0" returns placeholder info', res.status === 200 && res.data.doctor === 'none', `Status: ${res.status}`);

    // Test Doctor Total Count
    res = await client.get('/api/doctors/count');
    recordTest('Doctor Count: Returns count number', res.status === 200 && typeof res.data.totalDoctors === 'number', `Total: ${res.data?.totalDoctors}`);

    // Test Doctor Update
    res = await client.put(`/api/doctor/${doctorId}`, {
      name: docName + '_Updated',
      phoneNo: docPhone,
      address: 'Updated Street 123'
    });
    recordTest('Doctor Update: Valid', res.status === 200 && res.data.updatedDoctor?.address === 'Updated Street 123', `Status: ${res.status}`);

    // ==========================================
    // 4. PATIENT CRUD & LOGICS
    // ==========================================
    console.log('\n--- Testing Patient CRUD & Logics ---');

    const patientPhone = Math.floor(1000000000 + Math.random() * 9000000000);
    const patientName = 'Patient_' + Date.now();
    res = await client.post('/api/patient/add', {
      name: patientName,
      age: '30',
      gender: 'Male',
      address: 'Civil Lines',
      phoneNo: patientPhone
    });
    recordTest('Patient Add: Valid', res.status === 200 && res.data.success === true, `Status: ${res.status}`);

    // Check patient is new by phone
    res = await client.get(`/api/checkPatient?phoneNo=${patientPhone}`);
    recordTest('Patient Check By Phone: Existing returns isNew=false', res.status === 200 && res.data.isNew === false, `isNew: ${res.data?.isNew}`);

    res = await client.get(`/api/checkPatient?phoneNo=999999999999`);
    recordTest('Patient Check By Phone: Non-existent returns isNew=true', res.status === 200 && res.data.isNew === true, `isNew: ${res.data?.isNew}`);

    // Get patients by phone
    res = await client.get(`/api/patients?phoneNo=${patientPhone}`);
    const foundPatient = res.data.patients?.[0];
    const patientId = foundPatient?._id;
    recordTest('Patient Get By Phone: Found', res.status === 200 && !!foundPatient, `PatientId: ${patientId}`);

    // Get patient by ID
    res = await client.get(`/api/patient/${patientId}`);
    recordTest('Patient Get By ID: Valid', res.status === 200 && res.data.patient?.name === patientName, `Status: ${res.status}`);

    // Update patient
    res = await client.put(`/api/patient/${patientId}`, {
      name: patientName + '_Updated',
      age: '31',
      gender: 'Male',
      address: 'New Civil Lines',
      phoneNo: patientPhone
    });
    recordTest('Patient Update: Valid', res.status === 200 && res.data.updatedPatient?.age === '31', `Status: ${res.status}`);

    // Get patient count
    res = await client.get('/api/patients/count');
    recordTest('Patient Count: Valid number', res.status === 200 && typeof res.data.totalPatients === 'number', `Count: ${res.data?.totalPatients}`);

    // Get all patients
    res = await client.get('/api/allPatients');
    recordTest('All Patients: Returns list', res.status === 200 && Array.isArray(res.data.patients), `Status: ${res.status}`);

    // ==========================================
    // 5. ORDER CRUD & BUSINESS LOGICS
    // ==========================================
    console.log('\n--- Testing Order Placement, Commissions & CRUD ---');

    // Get initial doctor commission
    const docBefore = await DoctorDB.findById(doctorId);
    const initialCommission = docBefore?.totalCommission || 0;

    const orderData = {
      name: patientName,
      age: '30',
      gender: 'Male',
      address: 'Civil Lines',
      phoneNo: patientPhone,
      category: updatedCatName,
      subcategory: subCatName,
      fees: 2000,
      discount: 200,
      finalPayment: 1800,
      paymentMode: 'Cash',
      referralFee: 500, // Commission should be 500 - 200 = 300
      placedBy: 'OperatorTest',
      referredBy: doctorId.toString(),
      online: 0,
      cash: 1800
    };

    res = await client.post('/api/placeOrder', orderData);
    recordTest('Order Place: Valid order created', res.status === 201 && !!res.data.order, `Status: ${res.status}`);
    const createdOrder = res.data.order;
    const orderId = createdOrder?._id;

    // Check serialNo format DDMMYYYYxx
    const today = new Date();
    const dayStr = String(today.getDate()).padStart(2, '0');
    const monthStr = String(today.getMonth() + 1).padStart(2, '0');
    const expectedPrefix = `${dayStr}${monthStr}${today.getFullYear()}`;
    recordTest('Order Place: Serial number format check', createdOrder?.serialNo?.startsWith(expectedPrefix), `SerialNo: ${createdOrder?.serialNo}`);

    // Check Doctor Commission was updated: initial + (500 - 200) = initial + 300
    const docAfter = await DoctorDB.findById(doctorId);
    const expectedCommission = initialCommission + (500 - 200);
    recordTest('Order Place: Doctor commission updated correctly', docAfter?.totalCommission === expectedCommission, `Expected: ${expectedCommission}, Got: ${docAfter?.totalCommission}`);

    // Place Order with referredBy = 'none'
    const orderDataNone = {
      ...orderData,
      referredBy: 'none'
    };
    res = await client.post('/api/placeOrder', orderDataNone);
    const orderNone = res.data.order;
    recordTest('Order Place: "none" doctor handled and placeholder assigned', res.status === 201 && !!orderNone?.referredBy, `ReferredBy: ${orderNone?.referredBy}`);

    // Check Fetch Order by ID
    res = await client.get(`/api/fetchOrder/${orderId}`);
    recordTest('Order Fetch By ID: Valid', res.status === 200 && res.data.order?._id === orderId, `Status: ${res.status}`);

    // Check Orders Count
    res = await client.get('/api/orders/count');
    recordTest('Order Count: Returns number', res.status === 200 && typeof res.data.totalOrders === 'number', `Total: ${res.data?.totalOrders}`);

    // Check Filtered / Paginated Orders
    res = await client.get(`/api/orders/filter?page=1&limit=10`);
    recordTest('Order Filter: Paginated with page & limit', res.status === 200 && Array.isArray(res.data.orders) && res.data.totalPages >= 1, `TotalPages: ${res.data?.totalPages}`);

    // Check Filtered with skip & limit (for MonthlyReport UI)
    res = await client.get(`/api/orders/filter?skip=0&limit=5`);
    recordTest('Order Filter: Works with skip & limit', res.status === 200 && Array.isArray(res.data.orders), `Length: ${res.data?.orders?.length}`);

    // Check Search Query filter
    res = await client.get(`/api/orders/filter?searchQuery=${encodeURIComponent(patientName)}`);
    const foundBySearch = res.data.orders?.some(o => o.name === patientName);
    recordTest('Order Filter: Search by patient name', res.status === 200 && foundBySearch, `Found: ${foundBySearch}`);

    // Test Edit Order: Change discount from 200 to 100
    // Expected new commission: referralFee (500) - newDiscount (100) = 400
    // Commission diff: +100 to doctor
    res = await client.put(`/api/orders/${orderId}`, {
      discount: 100,
      finalPayment: 1900
    });
    recordTest('Order Edit: Update discount', res.status === 200 && res.data.order?.discount === 100, `Status: ${res.status}`);

    const docAfterEdit = await DoctorDB.findById(doctorId);
    const expectedCommissionAfterEdit = initialCommission + (500 - 100);
    recordTest('Order Edit: Doctor commission adjusted after discount update', docAfterEdit?.totalCommission === expectedCommissionAfterEdit, `Expected: ${expectedCommissionAfterEdit}, Got: ${docAfterEdit?.totalCommission}`);

    // Test getPatientsByDoctorAndDate (Patients Report for Doctor)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 1);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 1);

    res = await client.get(`/api/patientsReport?doctorId=${doctorId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
    recordTest('Patients Report: Fetches doctor report by ObjectId and Date', res.status === 200 && res.data.patients?.length > 0, `Status: ${res.status}, Patients: ${res.data?.patients?.length}`);

    // ==========================================
    // 6. UNBILLED ORDERS TESTS
    // ==========================================
    console.log('\n--- Testing Unbilled Orders ---');

    const unbilledData = {
      name: 'Unbilled_' + patientName,
      age: '28',
      gender: 'Female',
      address: 'Test Colony',
      phoneNo: patientPhone,
      category: updatedCatName,
      subcategory: subCatName,
      fees: 1500,
      discount: 100,
      finalPayment: 1400,
      paymentMode: 'Online',
      referralFee: 300,
      placedBy: 'OperatorTest',
      referredBy: doctorId.toString()
    };

    res = await client.post('/api/createUnbilled', unbilledData);
    recordTest('Unbilled Create: Valid', res.status === 201 && res.data.unbilled?.serialNo?.startsWith('UB'), `Serial: ${res.data.unbilled?.serialNo}`);
    const unbilledId = res.data.unbilled?._id;

    res = await client.get(`/api/fetchUnbilledOrderById/${unbilledId}`);
    recordTest('Unbilled Fetch By ID: Valid', res.status === 200 && res.data.order?._id === unbilledId, `Status: ${res.status}`);

    res = await client.get('/api/fetchAllUnbilledOrder');
    recordTest('Unbilled Fetch All: Valid list', res.status === 200 && Array.isArray(res.data.orders), `Count: ${res.data?.orders?.length}`);

    res = await client.delete(`/api/unbilled/${unbilledId}`);
    recordTest('Unbilled Delete: Valid', res.status === 200, `Status: ${res.status}`);

    // ==========================================
    // 7. CLEANUP & DELETE CASCADE LOGICS
    // ==========================================
    console.log('\n--- Testing Delete Cascades & Reassignment ---');

    // Test Delete Doctor: Orders should be reassigned to 'None' doctor
    res = await client.delete(`/api/doctor/${doctorId}`);
    recordTest('Doctor Delete: Successfully deleted', res.status === 200, `Status: ${res.status}`);

    // Check that createdOrder has referredBy reassigned to 'None' doctor
    const orderAfterDoctorDelete = await Order.findById(orderId);
    const noneDoc = await DoctorDB.findOne({ name: /^None$/i });
    recordTest('Doctor Delete: Order reassigned to None doctor', String(orderAfterDoctorDelete?.referredBy) === String(noneDoc?._id), `ReferredBy: ${orderAfterDoctorDelete?.referredBy}, NoneId: ${noneDoc?._id}`);

    // Test Delete Order
    res = await client.delete(`/api/orders/${orderId}`);
    recordTest('Order Delete: Successfully deleted', res.status === 200, `Status: ${res.status}`);

    // Test Delete SubCategory
    res = await client.delete(`/api/subcategory/${subCatId}`);
    recordTest('SubCategory Delete: Valid', res.status === 200, `Status: ${res.status}`);

    // Test Delete Category
    res = await client.delete(`/api/category/${catId}`);
    recordTest('Category Delete: Valid', res.status === 200, `Status: ${res.status}`);

    // Test Delete Operator
    res = await client.delete(`/api/operators/${createdOp?._id}`);
    recordTest('Operator Delete: Valid', res.status === 200, `Status: ${res.status}`);

    // Clean up test admin and test patient
    await Admin.findByIdAndDelete(adminDoc._id);
    await Patient.findByIdAndDelete(patientId);
    if (orderNone?._id) await Order.findByIdAndDelete(orderNone._id);

  } catch (error) {
    console.error('CRITICAL UNHANDLED ERROR IN TEST SUITE:', error);
  } finally {
    console.log('\n==========================================');
    console.log(`TEST RESULTS: ${testResults.passed} PASSED, ${testResults.failed} FAILED`);
    console.log('==========================================');

    await mongoose.connection.close();
    process.exit(testResults.failed > 0 ? 1 : 0);
  }
}

runTests();
