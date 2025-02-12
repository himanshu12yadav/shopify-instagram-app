import { json } from "@remix-run/node";

export const loader = async ({ request }) => {
  console.log("fetchPosts running");
  const { getAllInstagramPostbyCondition } = await import("../db.server.js");

  const posts = await getAllInstagramPostbyCondition({
    selected: true,
  });

  console.log("posts", posts.length);

  const test = JSON.stringify({
    message: "Success reached",
  });

  return json(
    {
      test: posts,
    },
    {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-cache",
        "Content-Type": "application/json",
      },
    },
  );
};
