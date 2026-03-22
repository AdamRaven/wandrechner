ich möchte eine einfache nextjs app entwickeln. bitte nutze javascript tailwind. 
dort soll es einfachen user login mit email passwort geben. 
postgres datenbank mit prisma.
der user soll sich ganz einfach registrieren können mit email und passwort.
es soll keine verifizierungs email rausgeschickt werden.

der user ist ein bauarbeiter der wissen möchte wie viele quadratmeter wand zur isolierung er seinem kunden verrechnen muss.

wenn der nutzer sich einlogt sieht er ein dashboard mit allen seinen projekten.
am anfang hat er 0 projekte.
er kann oben rechts mit einem + ein projekt anlegen.
es soll sich ein modal öffnen wo er projekt erstellt. ( name. datum.)
wenn er dann auf eine projekt karte draufdrückt nachdem er das projekt erstellt hat soll er da eine tabelle anlegen können. 

die tablle soll übersichtbar sein und simpel aussehen.

in der tabelle soll man dann verschiedene seiten anlegen können ( das dient nur zur organisation ) 

das ist dann der content für diese seiten = [

in der tabelle kann er dann verschiedene wände einer baustelle anlegen können wo er die breite der wand und die höhe mit eingibt (den namen der wand auch und anzahl der wände).
die quadratmeter der wände müssen dann rechts zusammen gerechnet werden. und unten rechts alle zusammen addiert werden.

dazu soll der user zu der tabelle fenter hinzufügen können (mit name, anzahl, höhe und breite)

die quadratmeter der fenster sollen dann auch rechts zusammen gerechnet werden.

hier kommt aber eine kleine logik ins spiel. wenn die fenster kleiner sind als 2,5 quadratmeter (pro 1 stück fenster) wird das als 0 eingetragen rechts. weil man da keine zuätzliche isolierung machen muss.
wenn die fenster aber grösser sind als 2,5 quadratmeter dann muss die fläche von den wänden in der rechnung abgezogen werden!

]

mit dieser logik soll der user am ende sehen wie viel quadrat meter er insgesamt zu rechung stellen muss.

es soll bei den projekten auch einen button geben wo der user die tabelle als pdf runterladen kann damit er sie dem kunden schicken kann. 

die mobile responsiveness von dem projekt soll on top sein damit der nutzer die website auch aus dem handy aus super bedienen kann!