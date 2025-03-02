document.addEventListener('DOMContentLoaded', () => {
    const blogForm = document.getElementById('blogForm');
    const blogContent = document.getElementById('blogContent');
    const mediaUrlInput = document.getElementById('mediaUrl');
    const preview = document.getElementById('preview');
    const msg = document.getElementById('msg');
  
    function updatePreview() {
      let content = blogContent.value;
      let mediaUrl = mediaUrlInput.value;
      let html = content;
      if (mediaUrl) {
        html += `<br/><img src="${mediaUrl}" alt="Media" class="blog-media">`;
      }
      preview.innerHTML = html || "Your live preview will appear here...";
    }
  
    if (blogContent) blogContent.addEventListener('input', updatePreview);
    if (mediaUrlInput) mediaUrlInput.addEventListener('input', updatePreview);
  
    if (blogForm) {
      blogForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new URLSearchParams();
        formData.append('content', blogContent.value);
        formData.append('mediaUrl', mediaUrlInput.value);
  
        try {
          const response = await fetch('/blog', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString()
          });
          const resultText = await response.text();
          msg.innerHTML = resultText;
          msg.style.display = 'block';
          msg.style.opacity = 1;
          setTimeout(() => {
            msg.style.transition = 'opacity 1s';
            msg.style.opacity = '0';
          }, 3000);
        } catch (error) {
          console.error('Error updating blog:', error);
          msg.innerHTML = '<p style="color:red;">An error occurred while updating your blog.</p>';
          msg.style.display = 'block';
        }
      });
    }
  });
  