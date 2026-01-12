# Project Estimation - CURRENT
Date: 26/04/2024

|Version number| Change |
|:---:|:---:|
|1.1|Prima compilazione Estimation V1 |
|1.2|Revisione calcoli Estimation V1|
|1.3|Inserimento diagramma di Gantt|
|1.4|Revisione finale Estimation V1 |


# Estimation approach
Consider the EZElectronics  project in CURRENT version (as given by the teachers), assume that you are going to develop the project INDEPENDENT of the deadlines of the course, and from scratch
# Estimate by size
### 
|             | Estimate                        |             
| ----------- | ------------------------------- |  
| NC =  Estimated number of classes to be developed   |3|             
|  A = Estimated average size per class, in LOC       |300| 
| S = Estimated size of project, in LOC (= NC * A) |900|
| E = Estimated effort, in person hours (here use productivity 10 LOC per person hour)  |90 ph|   
| C = Estimated cost, in euro (here use 1 person hour cost = 30 euro) |€ 2700| 
| Estimated calendar time, in calendar weeks (Assume team of 4 people, 8 hours per day, 5 days per week ) |0.56 weeks|  

- Il numero di classi *NC* considerato è stato calcolato, basandosi sul solo numero di classi inserite nel glossario.  
- La dimensione media di ciascuna classe, espressa in termini di *LOC*, è stata calcolata basandosi sulla lunghezza della definizione della classe fornita nel codice e ipotizzando la lunghezza dei metodi (compresi quelli di testing) che in essa dovrebbero essere implementati. I risultati sucessivi derivano quindi da questa considerazione.

# Estimate by product decomposition
### 
|         component name    | Estimated effort (person hours)   |             
| ----------- | ------------------------------- | 
|requirement document    |25 ph|
|GUI prototype |10 ph| 
|design document |5 ph|
|code |50 ph|
|unit tests |5 ph|
|api tests |5 ph|
|management documents  |4 ph|  

- Il tempo stimato in person hours per *GUI prototype* è stato calcolato basandosi sullo sviluppo del solo mockup.



# Estimate by activity decomposition
### 
|         Activity name    | Estimated effort (person hours)   |             
| ----------- | ------------------------------- | 
|Reverse engineering del codice fornito|3 ph|  
|Classificazione dei requisiti|2 ph|
|Documentazione dei requisiti|15 ph|  
|Revisione dei requisiti|3 ph| 
|Creazione mockup dell'interfaccia utente|10 ph|
|Revisione GUI prototype|2 ph|
|Definizione architettura del sistema|1 ph|
|Identificazione componenti principali|2 ph|
|Definizione relazioni tra i moduli|1 ph|
|Revisione design document|1 ph|
|Sviluppo moduli principali|25 ph|
|Implementazione funzionalità|20 ph|
|Creazione unit test e API test|5 ph|
|Esecuzione unit test e API test|3 ph|
|Revisione codice|5 ph|

## Gantt diagram
Le stime sono state fatte ipotizzando giornate lavorative da 8 ore e un team composto da 4 persone. I weekend non sono considerati giorni lavorativi.  

![Gantt](immagini/Gantt_v1.png)


# Summary

|             | Estimated effort                        |   Estimated duration |          
| ----------- | ------------------------------- | ---------------|
| estimate by size |90 ph|0.56 weeks|
| estimate by product decomposition |104 ph|0.65 weeks|
| estimate by activity decomposition |98 ph|0.61 weeks|


Adottando le diverse metodologie (*by size*, *by product decomposition*, *by activity decomposition*), si sono ottenute stime più o meno simili, prospettiva che sembra suggerire che il progetto software è sufficientemente definito e che si ha un'idea piuttosto chiara su quelli che saranno i costi. Tuttavia, è sempre bene considerare le limitazioni e le incertezze associate a ciascun metodo di stima e valutare attentamente i fattori che potrebbero influenzare i costi di progetto nel tempo (ritardi, eventuali problemi tecnici, diversa capacità del team di gestire efficacemente le attività). 

Seppur più laboriosa rispetto ad altre metodologie, la stima **by activity decomposition** è forse quella più affidabile in quanto in grado di stimare i costi in person hours per ciascuna attività utile al completamento del progetto. La rappresentazione mediante il **diagramma di Gantt** consente di visualizzare chiaramente la sequenza delle attività, le eventuali dipendenze presenti tra ciascuna di esse e la durata complessiva progetto. Se mediante la stima *by activity decomposition* le eventuali interruzioni lavorative e l'impossibilità di parallelizzare determinate attività risultano infatti evidenti, così non è per le altre metodologie. Una stima *by size*, senz'altro più rapida e semplice da eseguire (in quanto basata sul solo numero di *LOC*), potrebbe non considerare importanti fattori come quelli sopramenzionati. 



