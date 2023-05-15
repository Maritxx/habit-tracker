import { Persistence } from "./persistence"
import { 
  Category, CategoryCollection, 
  Completion, CompletionCollection, 
  Habit, HabitCollection
} from "./types"

const KEY__ID_POOL = 'idpool'
const KEY__HABITS = 'habits'
const KEY__CATEGORIES = 'categories'
const KEY__COMPLETIONS = 'completions'

export class LocalStoragePersistence implements Persistence {
  /**
   * This implementation is not particularly scalable or reliable long-term
   * 
   * This is the model being used to persist data locally: 
   *    {
   *       idpool: 4
   *       habits: {
   *         'habit-1': { ... },
   *         'habit-3': { ... },
   *       },
   *       categories: {
   *         'category-2': { ... },
   *       },
   *       completions: {
   *         'completion-4': { ... }
   *       },
   *    }
   * 
   *  With every write, the entire tree for a given section of the 'database' (ie: 'habits', 'categories', 'completions') 
   *  is completely rewritten; additionally, every read/write requires a complete serialization/deserialization, converting 
   *  between a string and an in-memory Object with JSON.stringify/JSON.parse. This is an expensive and error-prone way of 
   *  reading and writing data, though it should be workable for a proof-of-concept that does not store significant quantities of data
   */

  private static idPool: number = -1
  private static getNextId(): number {
    if( this.idPool < 0 ) this.idPool = parseInt( localStorage.getItem( KEY__ID_POOL ) ?? '-1' )
    
    localStorage.setItem( KEY__ID_POOL, JSON.stringify( ++this.idPool ))
    return this.idPool
  }

  public async getHabit( id: string ): Promise<Habit | null> {
    const storedHabits = this.fetchHabits()
    return storedHabits[ id ]
  }

  public async getAllHabits(): Promise<HabitCollection> {
    return this.fetchHabits()
  }

  public async getHabitsByDate(date: Date, isComplete = false): Promise<HabitCollection> {
    // returns either all of the completed habits or all the habits that have not yet been completed for a given date
    const storedHabits = this.fetchHabits()
    const todaysHabits = await this.getCompletionsByDate( date )
    const completedHabitIDs = Object.entries(todaysHabits).map(([ _, completion ]) => completion.habitID )

    return Object.fromEntries(
      Object.entries( storedHabits ).filter(
        ([ habitID ]) => isComplete ? completedHabitIDs.includes( habitID ) : !completedHabitIDs.includes( habitID ) // filter out any completed habits from the list
      )
    )
  }

  public async getHabitsByCategory( categoryID: string ): Promise<HabitCollection> {
    return Object.fromEntries(
      Object.entries( this.fetchHabits() )
        .filter(([ _, habit ]) => habit.categoryID === categoryID )
    )
  }

  public async getCategory( id: string ): Promise<Category | null> {
    const storedCategories = this.fetchCategories()
    return storedCategories[ id ]
  }

  public async getAllCategories(): Promise<CategoryCollection> {
    return this.fetchCategories()
  }

  public async getAllCompletions(): Promise<CompletionCollection> {
    return this.fetchCompletions()
  }

  public async getCompletionsByHabit( habitID: string ): Promise<CompletionCollection> {
    return Object.fromEntries(
      Object.entries( this.fetchCompletions() )
        .filter(([ _, completion ]) => completion.habitID === habitID )
    )
  }

  public async getCompletionsByDate( date: Date ): Promise<CompletionCollection> {
    return Object.fromEntries(
      Object.entries( this.fetchCompletions() )
        .filter(([ _, completion ]) => 
          completion.date.getFullYear() === date.getFullYear()
          && completion.date.getMonth() === date.getMonth()
          && completion.date.getDay() === date.getDay())
    )
  }

  public async getCompletionsByWeek( date: Date ): Promise<CompletionCollection> {
    const [startDate, endDate] = this.getCurrentWeekFromDate( date )
    return Object.fromEntries(
      Object.entries( this.fetchCompletions() )
        .filter(([ _, completion ]) => completion.date >= startDate && completion.date <= endDate )
    )
  }

  public async createHabit( name: string, categoryID: string | null = null ): Promise<Habit> {
    const storedHabits = this.fetchHabits()
    const newID = `habit-${LocalStoragePersistence.getNextId()}`

    storedHabits[ newID ] = { id: newID, name, categoryID: categoryID ?? undefined }
    return this.replaceStoredHabits( storedHabits )[ newID ]
  }

  public async createCategory( name: string, color: string ): Promise<Category> {
    const storedCategories = this.fetchCategories()
    const newID = `category-${LocalStoragePersistence.getNextId()}`

    storedCategories[ newID ] = { id: newID, name, color }
    return this.replaceStoredCategories( storedCategories )[ newID ]
  }

  public async createCompletion( habitID: string, date: Date ): Promise<Completion> {
    const storedCompletions = this.fetchCompletions()
    const newID = `completion-${LocalStoragePersistence.getNextId()}`

    storedCompletions[ newID ] = { id: newID, habitID, date }
    return this.replaceStoredCompletions( storedCompletions )[ newID ]
  }

  public async updateHabit( habitID: string, updates: Partial<Habit> ): Promise<Habit | null> {
    const storedHabits = this.fetchHabits()
    const existingHabit = storedHabits[ habitID ]
    if( !existingHabit ) return null
    
    storedHabits[ habitID ] = {
      ...existingHabit,
      ...updates,
    }

    return this.replaceStoredHabits( storedHabits )[ habitID ]
  }

  public async updateCategory( categoryID: string, updates: Partial<Category> ): Promise<Category | null> {
    const storedCategories = this.fetchCategories()
    const existingCategory = storedCategories[ categoryID ]
    if( !existingCategory ) return null

    storedCategories[ categoryID ] = {
      ...existingCategory,
      ...updates,
    }

    return this.replaceStoredCategories( storedCategories )[ categoryID ]
  }

  public async deleteHabit( id: string ): Promise<void> {
    const storedHabits = this.fetchHabits()
    if( !storedHabits[ id ] ) return

    delete storedHabits[ id ]
    this.replaceStoredHabits( storedHabits )
  }

  public async deleteCategory( id: string ): Promise<void> {
    const storedCategories = this.fetchCategories()
    if( !storedCategories[ id ] ) return

    // remove this category from all existing habits
    // TODO: this is an expensive operation
    const matchingHabits = await this.getHabitsByCategory( id )
    Object.entries( matchingHabits ).forEach(([ habitId, habit ]) => this.updateHabit( habitId, { ...habit, categoryID: undefined }))

    delete storedCategories[ id ]
    this.replaceStoredCategories( storedCategories )
  }

  public async deleteCompletion( id: string ): Promise<void> {
    const storedCompletions = this.fetchCompletions()
    if( !storedCompletions[ id ] ) return

    delete storedCompletions[ id ]
    this.replaceStoredCompletions( storedCompletions )
  }


  /**
   * Helper Methods ----------------------------------------------------------------------------------------------------
   */

  // Generic local storage CRUD operations
  private fetchLocalStorageData<DataType>( localStorageKey: string, defaultValue: any = { }): DataType {
    const localStorageData = localStorage.getItem( localStorageKey )
    if( !localStorageData ) localStorage.setItem( localStorageKey, JSON.stringify( defaultValue ) )

    return JSON.parse( localStorageData ?? '{}' ) as DataType
  }

  private replaceLocalStorageData<DataType>( localStorageKey: string, newData: DataType ): DataType {
    localStorage.setItem( localStorageKey, JSON.stringify( newData ))
    return newData
  }

  // typed, easier to use READ operations for specific data collections
  private fetchHabits(): HabitCollection {
    return this.fetchLocalStorageData<HabitCollection>( KEY__HABITS )
  }

  private fetchCategories(): CategoryCollection {
    return this.fetchLocalStorageData<CategoryCollection>( KEY__CATEGORIES )
  }

  private fetchCompletions(): CompletionCollection {
    return Object.fromEntries(
      Object.entries( this.fetchLocalStorageData<CompletionCollection>( KEY__COMPLETIONS ) )
        .map(([ id, completion ]) => [
          id,
          {
            ...completion,
            // JSON.parse may incorrectly parse the date as a string rather than a Date object.
            //  this step manually resolves this behavior
            date: new Date(( completion.date as unknown ) as string )
          }
        ])
    )
  }

  // typed, easier to use WRITE operations for specific data collections
  private replaceStoredHabits( habits: HabitCollection ): HabitCollection {
    return this.replaceLocalStorageData<HabitCollection>( KEY__HABITS, habits )
  }

  private replaceStoredCategories( categories: CategoryCollection ): CategoryCollection {
    return this.replaceLocalStorageData<CategoryCollection>( KEY__CATEGORIES, categories )
  }

  private replaceStoredCompletions( completions: CompletionCollection ): CompletionCollection {
    return this.replaceLocalStorageData<CompletionCollection>( KEY__COMPLETIONS, completions )
  }

  // additional helpers
  private getCurrentWeekFromDate( date: Date ): [Date, Date] {
    // TODO: this needs to be implemented properly
    const [weekStart, weekEnd] = [ new Date(), new Date() ]
    return [ weekStart, weekEnd ]
  }

}

export const database = new LocalStoragePersistence()