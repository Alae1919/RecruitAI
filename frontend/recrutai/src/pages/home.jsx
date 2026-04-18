import React, { useState, useEffect } from "react";
import ParallaxBanner from "../components/home_sections/parralax";
import FeaturesSection from "../components/home_sections/feature_sections";
import { div } from "three/webgpu";

const Home = () => {
  return (
    <div>
<ParallaxBanner></ParallaxBanner>
<FeaturesSection></FeaturesSection>
    </div>

  )

};

export default Home;
