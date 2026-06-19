import { useState } from 'react'

function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!username.trim() || !password.trim()) {
      setError('ユーザー名とパスワードを入力してください。')
      return
    }

    setError('')
    onLogin(username.trim())
  }

  return (
    <div className="login-page d-flex align-items-center justify-content-center min-vh-100">
      <div className="card shadow-sm p-4 w-100" style={{ maxWidth: 420 }}>
        <h1 className="h4 mb-3">勤怠ログイン</h1>
        <p className="text-muted">アプリを開始するにはログインしてください。</p>
        <form onSubmit={handleSubmit} className="mt-4">
          <div className="mb-3">
            <label className="form-label">ユーザー名</label>
            <input
              type="text"
              className="form-control"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="例: yamada"
            />
          </div>
          <div className="mb-3">
            <label className="form-label">パスワード</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="********"
            />
          </div>
          {error && <div className="alert alert-danger py-2">{error}</div>}
          <button type="submit" className="btn btn-primary w-100">ログイン</button>
        </form>
      </div>
    </div>
  )
}

export default LoginPage
