const GH_TOKEN = "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";
const GH_API_URL = "https://api.github.com/graphql";
/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `wrangler dev src/index.ts` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `wrangler publish src/index.ts --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

interface GithubPinnedRepos {
  data: {
    user: {
      pinnedItems: {
        nodes: {
          name: string;
          url: string;
          description: string;
          languages: {
            nodes: {
              name: string;
            }[];
          };
        }[];
      };
    };
  };
}

export interface Env {
  // Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
  // MY_KV_NAMESPACE: KVNamespace;
  //
  // Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
  // MY_DURABLE_OBJECT: DurableObjectNamespace;
  //
  // Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
  // MY_BUCKET: R2Bucket;
}

const getGithubUsername = (request: Request) => {
  const url = new URL(request.url);
  const username = url.searchParams.get("username");
  return username;
};

const isResponseValid = (response: GithubPinnedRepos) => {
  console.log(response);
  return response.data.user !== null;
};

const convertResponseToPinnedRepositoryList = (response: GithubPinnedRepos) => {
  const { pinnedItems } = response?.data?.user;
  const pinnedRepos = pinnedItems.nodes.map((node, idx) => {
    return {
      id: String(idx),
      repo: node.name,
      url: node.url,
      description: node.description,
      language: node.languages.nodes.map((languageNode) => languageNode.name),
    };
  });

  return pinnedRepos;
};

const getPinnedRepos = async (username: string) => {
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
    const isValid = isResponseValid(body);
    if (!isValid) return [];
    return convertResponseToPinnedRepositoryList(body);
  } catch (error) {
    console.error("Exception occured: ", error);
  }

  return [];
};

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const username = getGithubUsername(request);
    if (!username) {
      return new Response(
        JSON.stringify({
          error: true,
          message: `Username not found, example GET request ${request.url}?username=GH_USERNAME`,
        }),
        {
          status: 500,
        }
      );
    }
    const pinnedRepos = await getPinnedRepos(username);
    return new Response(JSON.stringify(pinnedRepos, null, 3));
  },
};
