import dotenv from 'dotenv'
dotenv.config()

export const setTokenIntoCookie = (res, accessToken, refreshToken, user) => {
  if (process.env.BUILD_MODE === 'prod') {
    if (user.role === 'admin') {
      res.cookie('access_token_admin', accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000
      })
      res.cookie('refresh_token_admin', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 30 * 24 * 60 * 60 * 1000
      })
    } else if (user.role === 'member') {
      res.cookie('access_token_member', accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000
      })
      res.cookie('refresh_token_member', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 30 * 24 * 60 * 60 * 1000
      })
    }
  } else if (process.env.BUILD_MODE === 'dev') {
    if (user.role === 'admin') {
      res.cookie('access_token_admin', accessToken, {
        httpOnly: false,
        maxAge: 7 * 24 * 60 * 60 * 1000
      })
      res.cookie('refresh_token_admin', refreshToken, {
        httpOnly: false,
        maxAge: 30 * 24 * 60 * 60 * 1000
      })
    } else if (user.role === 'member') {
      res.cookie('access_token_member', accessToken, {
        httpOnly: false,
        maxAge: 7 * 24 * 60 * 60 * 1000
      })
      res.cookie('refresh_token_member', refreshToken, {
        httpOnly: false,
        maxAge: 30 * 24 * 60 * 60 * 1000
      })
    }
  }
}

export const clearCookieAdmin = (res) => {
  const cookiesToClear = ['access_token_admin', 'refresh_token_admin']
  cookiesToClear.forEach((cookie) => {
    if (res.cookie[cookie]) {
      res.clearCookie(cookie)
    }
  })
}

export const clearCookieMember = (res) => {
  const cookiesToClear = ['access_token_member', 'refresh_token_member']
  cookiesToClear.forEach((cookie) => {
    if (res.cookie[cookie]) {
      res.clearCookie(cookie)
    }
  })
}
