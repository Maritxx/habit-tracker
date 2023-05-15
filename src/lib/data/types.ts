
export interface Habit {
  id?: string
  name: string
  categoryID?: string
}

export interface Category {
  id?: string
  name: string
  color: string
}

export interface Completion {
  id?: string
  habitID: string
  date: Date
}



export type KeyedCollection<DataType> = {[id: string]: DataType}
export type HabitCollection = KeyedCollection<Habit>
export type CategoryCollection = KeyedCollection<Category>
export type CompletionCollection = KeyedCollection<Completion>
