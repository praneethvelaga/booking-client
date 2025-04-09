export default{
    hostname: process.env.NODE_ENV === 'production'
  ? 'https://booking-server.onrender.com/api'
  : 'http://localhost:4000/api',


publicEndPoints: new Map([
    ["auth", {path:"/auth/autontication", method: ['post']}],
    ["register", {path:"/regist/RegisterNewUser", method: ['post']}],
]),

privateEndPoints: new Map([
    ["home", { path: "/home/homeProfile", method: "get" }],
    ["Constituencies",{path : "/Constituencies/list", method: "get"}],
    ["busesList",{path : "/buseslist/list", method: "post"}],
    ["buses",{path : "/buses/", method: "get"}],
    ["EmpValidation",{path : "/Validation/empId", method: "post"}],
    ["BookingSeat",{path:'/bookingSeats/reservation', method:"post"}],
])
}