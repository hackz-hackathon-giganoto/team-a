import React from "react";
import { useAuth0, User } from "@auth0/auth0-react";

const LoginButton = () => {
  const { loginWithRedirect } = useAuth0();

  return (
    <button
      className="btn btn-info btn-block"
      onClick={() => loginWithRedirect()}
    >
      Sign in with Auth0
    </button>
  );
};

const LogoutButton = () => {
  const { logout } = useAuth0();

  return (
    <button
      className="btn btn-danger btn-block"
      onClick={() =>
        logout({ logoutParams: { returnTo: window.location.origin } })
      }
    >
      Logout
    </button>
  );
};

type NavBarProps = {
  user: User;
};

const NavBar = ({ user }: NavBarProps) => {
  return (
    <>
      {!user && <LoginButton />}
      {user && <LogoutButton />}
    </>
  );
};
export default NavBar;
