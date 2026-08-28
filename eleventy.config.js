export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("./src/css");
  eleventyConfig.addPassthroughCopy("./src/images");
  eleventyConfig.addPassthroughCopy("./src/images/index/");
  eleventyConfig.addPassthroughCopy("./src/fonts");
  eleventyConfig.addPassthroughCopy("./src/js");
  eleventyConfig.addPassthroughCopy("./src/depths");
  eleventyConfig.addPassthroughCopy("./src/box");
  eleventyConfig.addPassthroughCopy("./src/ocs");
  eleventyConfig.addPassthroughCopy("./src/tooltips");
  eleventyConfig.addPassthroughCopy("./src/blogs");

  return {
    dir: {
      input: "src",
      output: "public",
      includes: "_includes",
    },
  };
}