import pluginRss from "@11ty/eleventy-plugin-rss";

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("./src/css");
  eleventyConfig.addPassthroughCopy("./src/images");
  eleventyConfig.addPassthroughCopy("./src/fonts");
  eleventyConfig.addPassthroughCopy("./src/js");
  eleventyConfig.addPassthroughCopy("./src/tooltips");
  eleventyConfig.addPassthroughCopy("./src/lightbox");
  eleventyConfig.addPassthroughCopy("./src/mystuff/downloads");

  const english = new Intl.DateTimeFormat("en-uk");
  eleventyConfig.addFilter("niceDate", function (d) {
    return english.format(d);
  });

  eleventyConfig.addFilter("lower", function(value) { //| lower
    if (!value) return "";
    return value.toLowerCase();
  });

  eleventyConfig.addCollection("status", function(collectionApi) {
    return collectionApi.getFilteredByGlob("./src/status/*.md");
  });

  return {
    dir: {
      input: "src",
      output: "public",
      includes: "_includes",
    },
  };
}