import { GH_API_URL } from "./constant";
import { GithubPinnedRepos, PinnedReposAPIResponse } from "./interface/github";

export const getPinnedRepos = async (username: string, GH_TOKEN: string) => {
  const query = `
  query { 
    user (login: "${username}") {
      pinnedItems(first: 10, types: REPOSITORY) {
        nodes {
          ... on Repository {
            name
            url
            description
            languages(first: 5) {
              nodes {
                name
              }
            }
          }
        }
      }
    }
  }`;

  let githubData: PinnedReposAPIResponse = {
    status: 200,
    body: null,
    ok: false,
  };
  try {
    const response = await fetch(GH_API_URL, {
      method: "POST",
      body: JSON.stringify({ query }),
      headers: {
        Authorization: `Bearer ${GH_TOKEN}`,
        "User-Agent": "Github Cloudflare worker",
      },
    });

    const body: GithubPinnedRepos = await response.json();
    githubData.body = body;
    githubData.status = response.status;
    githubData.ok = response.ok;
    if (!response.ok) {
      githubData.error = body;
    }
  } catch (error) {
    githubData.status = 500;
    githubData.ok = false;
    githubData.error = error as Error;
    console.error("Exception occured: ", error);
  }

  return githubData;
};
