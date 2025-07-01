import AxiosDigestAuth from "@mhoc/axios-digest-auth";
import dotenv from "dotenv";
dotenv.config();

const payload = [{ ipAddress: "174.89.105.239", comment: "from node" }];
const username = process.env.ATLAS_PUBLIC_KEY;
const password = process.env.ATLAS_PRIVATE_KEY;
const url = `https://cloud.mongodb.com/api/atlas/v1.0/groups/${process.env.ATLAS_PROJECT_ID}/accessList`;
console.log("Username:", username);
console.log("password:", password);
console.log("URL:", url);
console.log("Payload:", payload);

const digestAuth = new AxiosDigestAuth({
  username: username,
  password: password,
});

async function addAccessList() {
  try {
    const res = await digestAuth.request({
      method: "POST", // <-- change to POST
      url: url,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      data: payload, // <-- body goes here
    });

    console.log(res.data);
  } catch (err) {
    console.error(err.response?.data ?? err);
  }
}

addAccessList();
