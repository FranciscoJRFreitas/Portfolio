// Required modules: fs for file operations and axios for HTTP requests.
// Install axios with: npm install axios

const fs = require('fs');
const axios = require('axios');

// File names
const inputFile = 'public/assets/playlist.txt';   // file containing search queries (one per line)
const outputFile = 'output.txt'; // file to write the results

// Function to perform a YouTube search and extract the first video ID
async function getVideoId(query) {
  // Construct the YouTube search URL
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  try {
    const response = await axios.get(url, {
      headers: {
        // Spoof a common browser user-agent to reduce the chance of being blocked
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
      }
    });

    const html = response.data;

    // Use a regex to find the first occurrence of a videoId in the response HTML.
    // YouTube video IDs are typically 11 characters long and consist of alphanumerics, '-' and '_'.
    const videoIdRegex = /"videoId":"([a-zA-Z0-9_-]{11})"/;
    const match = videoIdRegex.exec(html);
    if (match && match[1]) {
      return match[1];
    } else {
      console.error(`No video id found for query: "${query}"`);
      return 'NotFound';
    }
  } catch (error) {
    console.error(`Error fetching search results for query: "${query}"`, error.message);
    return 'Error';
  }
}

async function processQueries() {
  try {
    // Read the input file
    const data = fs.readFileSync(inputFile, 'utf8');
    // Split file into lines and filter out empty lines
    const queries = data.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    // Array to hold the output lines
    const outputLines = [];

    // Process each query sequentially
    for (const query of queries) {
      console.log(`Searching for: ${query}`);
      const videoId = await getVideoId(query);
      // Format: "videoID | Name of the Search"
      outputLines.push(`${videoId} | ${query}`);
      // Pause briefly between requests to be gentle on YouTube servers
      //await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Write the results to the output file
    fs.writeFileSync(outputFile, outputLines.join('\n'));
    console.log(`Output written to ${outputFile}`);
  } catch (err) {
    console.error('Error processing queries:', err.message);
  }
}

// Execute the script
processQueries();
