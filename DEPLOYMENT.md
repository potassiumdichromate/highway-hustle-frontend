# Highway Hustle - Deployment Guide 🚀

## Deployment Options

### Option 1: Vercel (Recommended for React Frontend)

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Login to Vercel**
```bash
vercel login
```

3. **Deploy**
```bash
vercel --prod
```

4. **Configure Custom Domain**
- Go to Vercel Dashboard
- Settings → Domains
- Add `highwayhustle.xyz`

### Option 2: Netlify

1. **Install Netlify CLI**
```bash
npm install -g netlify-cli
```

2. **Build the project**
```bash
npm run build
```

3. **Deploy**
```bash
netlify deploy --prod --dir=dist
```

4. **Configure Custom Domain**
- Go to Netlify Dashboard
- Domain Settings
- Add `highwayhustle.xyz`

### Option 3: Cloudflare Pages

1. **Build the project**
```bash
npm run build
```

2. **Connect GitHub Repository**
- Go to Cloudflare Pages Dashboard
- Create new project
- Connect your repository
- Build command: `npm run build`
- Build output directory: `dist`

3. **Configure Custom Domain**
- Pages → Custom Domains
- Add `highwayhustle.xyz`

### Option 4: AWS S3 + CloudFront

1. **Build the project**
```bash
npm run build
```

2. **Create S3 Bucket**
```bash
aws s3 mb s3://highwayhustle-frontend
```

3. **Enable Static Website Hosting**
```bash
aws s3 website s3://highwayhustle-frontend --index-document index.html
```

4. **Upload Build Files**
```bash
aws s3 sync dist/ s3://highwayhustle-frontend
```

5. **Setup CloudFront Distribution**
- Create CloudFront distribution
- Origin: Your S3 bucket
- Configure SSL certificate
- Add custom domain `highwayhustle.xyz`

## Environment Variables

Create `.env` file for environment-specific settings:

```env
# API Configuration (for Phase 2)
VITE_API_URL=https://api.highwayhustle.xyz
VITE_WEBSOCKET_URL=wss://api.highwayhustle.xyz

# Blockchain Configuration
VITE_CHAIN_ID=1
VITE_CONTRACT_ADDRESS=0x...

# Unity WebGL Build (Phase 2)
VITE_UNITY_BUILD_URL=https://cdn.highwayhustle.xyz/game

# Feature Flags
VITE_ENABLE_MARKETPLACE=false
VITE_ENABLE_AI_CHAT=false
```

## Build Optimization

### Production Build Checklist

- ✅ Minified JavaScript and CSS
- ✅ Optimized images and assets
- ✅ Tree-shaking unused code
- ✅ Code splitting for better performance
- ✅ Lazy loading for routes
- ✅ Gzip/Brotli compression enabled

### Performance Optimizations

1. **Enable Compression** (in `vite.config.js`)
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { compression } from 'vite-plugin-compression'

export default defineConfig({
  plugins: [
    react(),
    compression({ algorithm: 'gzip' }),
    compression({ algorithm: 'brotliCompress', ext: '.br' })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          three: ['three', '@react-three/fiber', '@react-three/drei'],
          web3: ['ethers']
        }
      }
    }
  }
})
```

2. **Image Optimization**
- Use WebP format for images
- Implement lazy loading
- Add proper width/height attributes

3. **Font Optimization**
- Use `font-display: swap` in CSS
- Preload critical fonts

## Domain Configuration

### DNS Settings for `highwayhustle.xyz`

**For Vercel:**
```
A     @     76.76.21.21
CNAME www   cname.vercel-dns.com
```

**For Netlify:**
```
A     @     75.2.60.5
CNAME www   your-site.netlify.app
```

**For Cloudflare:**
```
CNAME @     your-project.pages.dev (proxied)
CNAME www   your-project.pages.dev (proxied)
```

## SSL/HTTPS Configuration

All recommended platforms provide automatic SSL certificates via Let's Encrypt:
- **Vercel**: Automatic
- **Netlify**: Automatic
- **Cloudflare**: Automatic
- **AWS**: Use ACM (AWS Certificate Manager)

## Monitoring and Analytics

### Recommended Tools

1. **Google Analytics 4**
```html
<!-- Add to index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
```

2. **Sentry for Error Tracking**
```bash
npm install @sentry/react
```

3. **Web Vitals Monitoring**
```bash
npm install web-vitals
```

## CI/CD Pipeline

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Build
      run: npm run build
      
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v20
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
        vercel-args: '--prod'
```

## Post-Deployment Checklist

- [ ] Test wallet connection on production
- [ ] Verify all routes are accessible
- [ ] Check mobile responsiveness
- [ ] Test 3D background performance
- [ ] Validate SSL certificate
- [ ] Configure CDN caching
- [ ] Setup monitoring alerts
- [ ] Test MetaMask integration
- [ ] Verify all animations work smoothly
- [ ] Check console for errors
- [ ] Test on multiple browsers
- [ ] Verify custom domain resolves correctly

## Rollback Procedure

### Vercel
```bash
vercel rollback
```

### Netlify
```bash
netlify rollback
```

### Manual Rollback
Keep previous build artifacts in case you need to redeploy:
```bash
# Tag releases
git tag v1.0.0
git push origin v1.0.0

# Rollback to previous version
git checkout v1.0.0
npm run build
# Deploy previous version
```

## Maintenance

### Regular Updates
- Update dependencies monthly
- Monitor security vulnerabilities
- Review and optimize bundle size
- Update MetaMask integration as needed
- Keep Three.js and React libraries updated

### Performance Monitoring
- Monitor Core Web Vitals
- Check Lighthouse scores monthly
- Review error rates in Sentry
- Monitor API response times (Phase 2)

---

**Deploy with Confidence!** 🚀

Your synthwave racing empire awaits!
