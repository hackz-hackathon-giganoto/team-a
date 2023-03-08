import React from "react";

const NavBar = ({ user }: { user: object | null }) => {
  const redirect = `/`;

  return (
    <>
      {!user && (
        <span>
          <a
            href={`/.auth/login/google?post_login_redirect_uri=${redirect}`}
            className="btn btn-danger btn-block"
          >
            <i className="fa fa-google" /> Sign in with <b>Google</b>
          </a>
          <a
            href={`/.auth/login/twitter?post_login_redirect_uri=${redirect}`}
            className="btn btn-info btn-block"
          >
            <i className="fa fa-twitter" /> Sign in with <b>Twitter</b>
          </a>
          <a
            href={`/.auth/login/github?post_login_redirect_uri=${redirect}`}
            className="btn btn-dark btn-block"
          >
            <i className="fa fa-github" /> Sign in with <b>Github</b>
          </a>
        </span>
      )}
      {user && (
        <div>
          <a
            href={`/.auth/logout?post_logout_redirect_uri=${redirect}`}
            className="btn btn-danger btn-block"
          >
            <b>Logout</b>
          </a>
        </div>
      )}
    </>
  );
};
export default NavBar;
