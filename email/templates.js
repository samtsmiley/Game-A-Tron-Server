'use strict';
const {CLIENT_ORIGIN} = require('../config');

function confirm(id) {
  return {
    subject: 'Confirm Email',
    // html: `
    //   <a href='${CLIENT_ORIGIN}/confirm/${id}>
    //     click to confirm email
    //   </a>
    // `,
    html: `Please click the link to confirm your email: ${CLIENT_ORIGIN}/confirm/${id}`,
    text: `Copy and paste this link: ${CLIENT_ORIGIN}/confirm/${id}`
  };
}

module.exports = {confirm};
