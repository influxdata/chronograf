// To run stories, CHRONOGRAF_SOURCES env variable must be set to a sources object. See Hunter for one.
const source = () => {
  console.log(process.env)
  return JSON.parse(process.env.STORYBOOK_CHRONOGRAF_SOURCE);
}

export default source;
