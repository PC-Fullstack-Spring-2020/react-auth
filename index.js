import React, { useContext, createContext, useState } from "react"
import { Route, Redirect } from "react-router-dom"
import { decode } from "jsonwebtoken"

class AuthService {
  constructor(config = {}) {
    this.domain = config.domain || "/api"
    this.authPath = config.authPath || "login"
  }

  login = (username, password) => {
    return this.fetch(`${this.domain}/${this.authPath}`, {
      method: "POST",
      body: JSON.stringify({
        username,
        password
      })
    }).then(resp => {
      this.setToken(resp.token)
      return Promise.resolve(resp)
    })
  }

  logout = () => {
    localStorage.removeItem("authtoken")
  }

  loggedIn = () => {
    const token = this.getToken()
    return !!token && !this.isTokenExpired(token)
  }

  isTokenExpired = token => {
    try {
      const decoded = decode(token)
      return decoded.exp < Date.now() / 1000
    } catch (err) {
      return false
    }
  }

  setToken = token => localStorage.setItem("authtoken", token)

  getToken = () => localStorage.getItem("authtoken")

  getProfile = () => decode(this.getToken())

  _checkStatus = response => {
    if (response.status >= 200 && response.status < 300) {
      return response
    } else {
      const error = new Error(response.statusText)
      error.response = response
      throw error
    }
  }

  get = url => this.fetch(url, { method: "GET" })

  post = (url, data) =>
    this.fetch(url, { method: "POST", body: JSON.stringify(data) })

  put = (url, data) =>
    this.fetch(url, { method: "PUT", body: JSON.stringify(data) })

  patch = (url, data) =>
    this.fetch(url, { method: "PATCH", body: JSON.stringify(data) })

  delete = url => this.fetch(url, { method: "DELETE" })

  fetch = (url, options) => {
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json"
    }

    if (this.loggedIn()) {
      headers["Authorization"] = `Bearer ${this.getToken()}`
    }

    return this.fetch(url, { headers, ...options })
      .then(this._checkStatus)
      .then(resp => resp.json())
  }
}

export const api = new AuthService()

export const AuthContext = createContext({
  isAuthenticated: false,
  redirectUrl: "/login"
})

export const AuthProvider = props => {
  const [isAuthenticated, setAuthenticated] = useState(api.loggedIn())

  function signin() {
    return new Promise((resolve, reject) => {
      api
        .login(username, password)
        .then(data => {
          setAuthenticated(true)
          resolve(api.getProfile())
        })
        .catch(err => {
          reject(err)
        })
    })
  }

  function signout() {
    return new Promise((resolve, reject) => {
      api.logout()
      setAuthenticated(false)
      resolve()
    })
  }

  const value = {
    isAuthenticated: isAuthenticated,
    redirectUrl: props.redirectUrl,
    signin: signin,
    signout: signout
  }

  return (
    <AuthContext.Provider value={value}>{props.children}</AuthContext.Provider>
  )
}

AuthProvider.defaultProps = {
  redirectUrl: "/login"
}

export const AuthRoute = ({ component: Component, ...rest }) => {
  const auth = useContext(AuthContext)
  return (
    <Route
      {...rest}
      render={props =>
        auth.isAuthenticated ? (
          <Component {...props} />
        ) : (
          <Redirect to={auth.redirectUrl} />
        )
      }
    />
  )
}

export function useAuth() {
  const { signin, signout, isAuthenticated } = useContext(AuthContext)

  return { signin, signout, isAuthenticated }
}
