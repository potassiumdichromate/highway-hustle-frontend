// Configuration for Unity WebGL builds hosted on Cloudflare R2
// Update these URLs with your actual R2 bucket URLs

const UNITY_BUILDS = {
    // Garage build
    garage: 'https://your-r2-bucket.r2.dev/Garage/index.html',
    
    // Game mode builds
    gameModes: {
      oneWay: 'https://pub-0025cff360c44334b8cc47c146e9c55c.r2.dev/OneWay/5/index.html',
      twoWay: 'https://pub-0025cff360c44334b8cc47c146e9c55c.r2.dev/TwoWay/2/index.html',
      speedRun: 'https://pub-0025cff360c44334b8cc47c146e9c55c.r2.dev/SpeedRun/1/index.html',
      timeBomb: 'https://pub-0025cff360c44334b8cc47c146e9c55c.r2.dev/TimeBomb/1/index.html'
    }
  };
  
  export default UNITY_BUILDS;
  
  // Example URLs structure:
  // If your R2 domain is: pub-abc123.r2.dev
  // And your builds are in folders like: /OneWay/, /TwoWay/, etc.
  // 
  // Then your URLs should be:
  // oneWay: 'https://pub-abc123.r2.dev/OneWay/index.html'
  // twoWay: 'https://pub-abc123.r2.dev/TwoWay/index.html'
  // etc.