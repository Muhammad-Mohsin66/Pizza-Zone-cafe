

const API_BASE_URL = 'http://localhost:8000/api';

export async function createBlog(title, body) {
  try {
    const response = await fetch(`${API_BASE_URL}/blog/create?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating blog:', error);
    throw error;
  }
}

export async function getAllBlogs() {
  try {
    const response = await fetch(`${API_BASE_URL}/blog/list`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching blogs:', error);
    throw error;
  }
}

export async function getBlogById(blogId) {
  try {
    const response = await fetch(`${API_BASE_URL}/blog/${blogId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching blog:', error);
    throw error;
  }
}

export async function updateBlog(blogId, title, body) {
  try {
    const response = await fetch(`${API_BASE_URL}/blog/${blogId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: title,
        body: body,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating blog:', error);
    throw error;
  }
}

export async function deleteBlog(blogId) {
  try {
    const response = await fetch(`${API_BASE_URL}/blog/${blogId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error deleting blog:', error);
    throw error;
  }
}

export async function testConnection() {
  try {
    const response = await fetch('http://localhost:8000/', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error connecting to backend:', error);
    throw error;
  }
}
