import {io} from 'socket.io-client';
const apiUrl = import.meta.env.VITE_API_URL;
console.log(apiUrl)
// const socket = io(apiUrl, {
//   autoConnect: true, // default is true
// });
const socket = io(window.location.origin);

export default socket;