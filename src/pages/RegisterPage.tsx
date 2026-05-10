import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    try {
      await register({ email, password });
      navigate('/collect');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <main className="page-shell">
    <h1 style={{ textAlign: 'center' }}>Loan Assessment Engine v1.0</h1><br></br>
      <section className="card">
        <h1>Register</h1>
        <form onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {error && <p className="error-message">{error}</p>}
          <button type="submit">Create account</button>
        </form>
        <p>
          Already registered? <Link to="/login">Login here</Link>
        </p>
      </section>
    </main>
  );
}
