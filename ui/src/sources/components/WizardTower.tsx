import React, {PureComponent} from 'react'
import WizardFullScreen from 'src/reusable_ui/components/wizard/WizardFullScreen'
import WizardStep from 'src/reusable_ui/components/wizard/WizardStep'

interface State {
  completion: object
}

class WizardTower extends PureComponent<null, State> {
  constructor(props) {
    super(props)
    this.state = {
      completion: {
        first: false,
        second: false,
        third: false,
      },
    }
  }
  public render() {
    return (
      <WizardFullScreen
        title="Wizard Tower"
        handleSkip={this.handleSkip}
        skipLinkText="configure later"
      >
        <WizardStep
          title="First Step"
          tipText="One is the lonliest number that you ever knew..."
          isComplete={this.completeTest('first')}
          onNext={this.handleFirstNext}
          onPrevious={this.handleFirstPrev}
        >
          Taxidermy readymade shabby chic whatever. Intelligentsia semiotics
          master cleanse, franzen shabby chic fanny pack literally roof party
          brooklyn gastropub cold-pressed tilde kombucha shoreditch. PBR&B
          mixtape squid raclette meggings vice. Poke austin cronut readymade meh
          prism keytar pok pok. Offal twee pickled gentrify, master cleanse
          bushwick wolf affogato. Heirloom fingerstache tote bag kombucha
          wayfarers succulents fanny pack, prism raw denim occupy meh venmo
          cronut edison bulb. Microdosing master cleanse thundercats skateboard
          cardigan leggings typewriter bitters williamsburg aesthetic.
          Letterpress master cleanse waistcoat slow-carb, affogato hexagon
          flexitarian williamsburg swag bicycle rights tilde. Next level blue
          bottle authentic godard vexillologist. Truffaut beard gastropub cronut
          street art chicharrones fanny pack paleo austin direct trade schlitz
          90's whatever. Fingerstache pabst biodiesel blue bottle typewriter
          8-bit, organic normcore. Bitters YOLO cronut yr typewriter
          williamsburg. Squid chambray tbh jean shorts subway tile. Tbh kogi
          venmo bitters hashtag plaid tofu. YOLO fanny pack vinyl keytar
          sustainable letterpress butcher church-key, woke cardigan celiac.
          Pinterest DIY freegan, lomo etsy gentrify aesthetic taiyaki chillwave
          sartorial. PBR&B trust fund cold-pressed scenester edison bulb enamel
          pin blog tousled skateboard normcore. Photo booth kitsch franzen
          edison bulb try-hard pitchfork venmo. Freegan pinterest flexitarian
          chillwave, messenger bag enamel pin tofu tousled gastropub bicycle
          rights. Banh mi wolf bicycle rights cardigan distillery retro. Poke
          scenester meditation, cornhole narwhal typewriter butcher etsy air
          plant celiac gentrify mustache polaroid 8-bit banh mi. Crucifix
          mustache readymade austin post-ironic keytar. Typewriter four loko
          cliche green juice woke ennui cray. Beard hashtag next level jean
          shorts jianbing salvia, umami truffaut readymade drinking vinegar
          semiotics sustainable single-origin coffee. Biodiesel butcher man
          braid hammock post-ironic 8-bit +1 quinoa retro pork belly af
          vaporware bespoke. Street art messenger bag sartorial tote bag
          keffiyeh 90's drinking vinegar biodiesel. Beard narwhal semiotics,
          pabst butcher pour-over lo-fi iceland. Tbh vegan tacos distillery food
          truck. Migas irony dreamcatcher mustache kickstarter direct trade
          everyday carry, polaroid man braid etsy tumeric bushwick. Kitsch deep
          v meh kickstarter small batch biodiesel. Squid green juice sartorial
          pork belly wolf. 90's chambray schlitz pok pok kinfolk tote bag forage
          yr four dollar toast lomo edison bulb twee pickled hashtag biodiesel.
          Live-edge forage woke, keytar kombucha actually skateboard fanny pack
          retro cliche celiac meggings brunch shabby chic. Fanny pack
          chicharrones hexagon food truck, lumbersexual kombucha 90's actually
          shabby chic heirloom. Franzen post-ironic chartreuse cred mlkshk next
          level sustainable ethical chia affogato chillwave. Humblebrag iceland
          beard trust fund. Synth VHS selfies occupy everyday carry truffaut
          fingerstache pug small batch mlkshk ramps pop-up knausgaard pabst
          whatever. Salvia flannel health goth tote bag meggings, pok pok
          kombucha. Etsy lo-fi offal scenester locavore, normcore deep v. Lo-fi
          heirloom pickled activated charcoal. Wayfarers four loko pinterest
          heirloom, thundercats cray hoodie godard kinfolk schlitz letterpress
          bitters microdosing mustache church-key. Disrupt hashtag yuccie
          bespoke YOLO af DIY readymade. Distillery kickstarter listicle, pug
          food truck vice ethical. Seitan af humblebrag live-edge. Etsy keytar
          palo santo fashion axe iceland shoreditch kickstarter cornhole bicycle
          rights. Jianbing butcher locavore intelligentsia lo-fi readymade,
          bespoke gluten-free green juice pug VHS salvia craft beer schlitz
          vegan. Health goth chicharrones affogato lo-fi chia deep v copper mug.
          Distillery stumptown bitters letterpress. Lo-fi gentrify umami four
          dollar toast glossier, kombucha DIY thundercats yr microdosing. Shabby
          chic hexagon shoreditch gastropub chia kinfolk adaptogen hammock
          master cleanse mixtape. You probably haven't heard of them hexagon
          succulents prism lo-fi waistcoat ethical. Humblebrag shaman woke,
          hella etsy raclette cronut pok pok marfa banjo gluten-free man braid
          craft beer williamsburg. Subway tile XOXO typewriter neutra retro
          farm-to-table +1 forage air plant. Slow-carb knausgaard prism, cloud
          bread ramps vinyl swag tofu sartorial +1. Paleo beard succulents,
          portland tousled adaptogen jean shorts intelligentsia. Blog hell of
          meditation gochujang cronut food truck pinterest venmo jean shorts
          glossier lomo. Oh. You need a little dummy text for your mockup? How
          quaint. I bet you’re still using Bootstrap too…
        </WizardStep>
        <WizardStep
          title="Second Step"
          tipText="It takes two to tango."
          isComplete={this.completeTest('second')}
          onNext={this.handleSecondNext}
          onPrevious={this.handleSecondPrev}
          nextLabel="Go On!"
          previousLabel="Now hold on a sec..."
        >
          some second children
        </WizardStep>
        <WizardStep
          title="Third Step"
          tipText="Three's a crowd... or drama..."
          isComplete={this.completeTest('third')}
          onNext={this.handleThirdNext}
          onPrevious={this.handleThirdPrev}
        >
          some third children
        </WizardStep>
      </WizardFullScreen>
    )
  }

  private handleSkip = () => {
    // HANDLE SKIP
  }

  private completeTest = curr => () => {
    const {completion} = this.state
    return completion[curr]
  }

  private handleFirstNext = () => {
    const {completion} = this.state
    this.setState({
      completion: {...completion, first: true},
    })
  }

  private handleSecondNext = () => {
    const {completion} = this.state
    this.setState({
      completion: {...completion, second: true},
    })
  }

  private handleThirdNext = () => {
    const {completion} = this.state
    this.setState({
      completion: {...completion, third: true},
    })
  }

  private handleFirstPrev = () => {
    const {completion} = this.state
    this.setState({
      completion: {...completion, first: false},
    })
  }

  private handleSecondPrev = () => {
    const {completion} = this.state
    this.setState({
      completion: {...completion, second: false},
    })
  }

  private handleThirdPrev = () => {
    const {completion} = this.state
    this.setState({
      completion: {...completion, third: false},
    })
  }
}

export default WizardTower
