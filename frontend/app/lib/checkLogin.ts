export const checkLogin = (router: any) => {
    // A simple check to see if the user is "logged in"
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/');
    }
}