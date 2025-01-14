import './index.css'
import { BrowserRouter, Routes, Route, useParams } from "react-router";
import TopBar from './components/TopBar'
import Home from './pages/Home'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import CommDemoPage from './pages/CommDemoPage'
import PageList from './components/PostList'
import NotFound from './pages/NotFound'
import CreatePostPage from './pages/createPostPage';

function DashboardRoutes() {
  const validDashboards = ['notice', 'free', 'qna']; 
  const { dashboard } = useParams(); 
  if (!validDashboards.includes(dashboard)) {
    return <NotFound />;
  }
  return <PageList />; 
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />

        <Route element={<TopBar />}>
          <Route path="/" element={<Home />} />
          <Route path="dashboards/:dashboard" element={<DashboardRoutes />} />
          <Route path ="createpost" element={<CreatePostPage />} />
        </Route>
        <Route path="/api/comm-demo" element={<CommDemoPage />} />

        <Route path = "*" element = {<NotFound />}></Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
