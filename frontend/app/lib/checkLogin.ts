import { USER_CHECK_URL } from "@/app/lib/constants";

export const checkLogin = (router: any, setCurrentUser: any) => {
  // A simple check to see if the user is "logged in"
  const token = localStorage.getItem('accessToken');
  // make a request to the backend to verify the token
  fetch(USER_CHECK_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }).then(res => {
    setCurrentUser(res.json())
  }).catch(err => {
    console.error("Error fetching data:", err)
    router.push("/")
  });
}